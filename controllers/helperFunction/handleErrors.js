function handleErrors(err) {
  // console.log(err.message, err.code);
  // console.log(err.message);
  let message = '';

  // incorrect email
  if (err.message === 'incorrect email') {
    message += 'That email is not registered. ';
  }

  // incorrect password
  else if (err.message === 'incorrect password') {
    message += 'That password is incorrect. ';
  }

  // duplicate email error
  else if (err.code === 11000) {
    Object.entries(err?.keyValue).forEach((elem) => {
      const strArr = elem[0].split('');
      strArr[0] = strArr[0].toUpperCase();
      message += `${strArr.join('')} '${elem[1]}' is already registered. `;
    });
  }

  // validation errors
  else if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      message += `${properties.message}. `;
      return null;
    });
  }

  //  else
  else message += err.message;

  return message;
}

module.exports = handleErrors;
