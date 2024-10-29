import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  //* get user details from input
  const { fullName, email, username, password } = req.body;

  //* Validation -> no empty field
  if (
    [fullName, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(409, "Fill All the fields");
  }

  //* check if the user already exists or not-> username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already existed");
  }

  //* check for images and avatar
  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  let coverImageLocalFilePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(409, "avatar need to be uploaded");
  }

  //* upload them to cloudnary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  if (!avatar) {
    throw new ApiError(409, "avatar need to be uploaded");
  }

  //* create user object-create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //* remove password and refresh token field from response
  const created_user = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  //* check for user creation
  if (!created_user) {
    throw new ApiError(500, "Something went wrong in the server");
  }

  //* return res
  return res
    .status(201)
    .json(new ApiResponse(200, created_user, "User sucessfully registerd"));
});

const genaratingAcessTokenAndRefreshToken = async (userId) => {
  const user = await User.findOne(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const loginUser = asyncHandler(async (req, res) => {
  //* take inputs from req.body
  //* username or email based login
  //* find the user
  //* password check
  //* access and refresh token
  //* send cookie

  const { fullName, username, password, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email Is Required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not Registerd");
  }

  const isValidPassword = await user.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await genaratingAcessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Succesfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: "true",
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // * making new refresh token
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Invalid request");
  }

  try {
    //* verifying the tokens (newly made refresh token and .env Refresh Token)
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN,
    );

    // * creating and accessing the user for verification
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "User Invalid Token");
    }

    //* matching and error handling the tokens
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(402, "refresh token expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // * if token matched, then have to again re-genarate tokens
    const { accessToken, newRefreshToken } =
      await genaratingAcessTokenAndRefreshToken(user._id);

    //* sending final response
    res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Successfully refreshed The access Token",
      );
  } catch (error) {
    throw new ApiError(404, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordValid = user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Old Password ! try again");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  res.status(200).json(201, {}, "Password Changes Successfully");
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(201, req.user, "User fetched Succesfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "please provide details");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
       email,
      },
    },
    { new: true },
  ).select("-password");

  return res.status(201).json(new ApiResponse(200,user,"Account Details Updated Successfully"));
});

const changeAvatarImage=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(401,"avatar file is missing")
  }
  
  const avatar=awiat uploadOnCloudinary(avatarLocalPath)
  
  if(!avatar.url){
    throw new ApiError(401,"error in finding url for the avatar image")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password");

  return res
         .status(201)
         .json(
          new ApiResponse(200,user,"Avatar Image changes Succesfully")
         )
})

const changeCoverImage=asyncHandler(async(req,res)=>{
  const CoverImageLocalPath=req.file?.path

  if(!CoverImageLocalPath){
    throw new ApiError(401,"cover image file is missing")
  }
  
  const CoverImage=awiat uploadOnCloudinary(CoverImageLocalPath)
  
  if(!CoverImage.url){
    throw new ApiError(401,"error in finding url for the CoverImage")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        CoverImage:CoverImage.url
      }
    },
    {new:true}
  ).select("-password");

  return res
         .status(201)
         .json(
          new ApiResponse(200,user,"CoverImage changes Succesfully")
         )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  changeAvatarImage,
  changeCoverImage
};
