export const uploadImage = async (file: string) => {
  const result = await cloudinary.uploader.upload(file)
  return result.secure_url
}
