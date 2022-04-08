function handleErrors(err) {
  // console.log(err.message, err.code);
  console.log(err.message);
  let message = "";

  // incorrect email
  if (err.message === "incorrect email") {
    message = "That email is not registered";
  }

  // incorrect password
  if (err.message === "incorrect password") {
    message = "That password is incorrect";
  }

  // duplicate email error
  if (err.code === 11000) {
    message = "Email address is already registered";
    return message;
  }

  // validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);

      message += `${properties.message}. `;
    });
  }

  return message;
}

module.exports = handleErrors;
