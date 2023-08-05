const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const cleanUpAndValidate = ({ name, email, username, password }) => {
  return new Promise((resolve, reject) => {
    if (!email || !password || !name || !username) {
      reject("Missing credentials");
    }

    if (typeof email !== "string") {
      reject("Invalid Email");
    }
    if (typeof username !== "string") {
      reject("Invalid Username");
    }
    if (typeof password !== "string") {
      reject("Invalid password");
    }

    if (username.length <= 2 || username.length > 50)
      reject("Username length should be 3-50");

    if (password.length <= 2 || password.length > 25)
      reject("Password length should be 3-25");

    if (!email.includes("@")) {
      reject("Invalid Email format");
    }
    if (!validator.isEmail(email)) {
      reject("Invalid Email format");
    }
    resolve();
  });
};

const genrateJWTToken = (email) => {
  const JWT_TOKEN = jwt.sign(email, process.env.SECRET_KEY);

  return JWT_TOKEN;
};

const sendVerficiationToken = async ({ email, verificationToken, req }) => {
  //nodemailer
  const transpoter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "Gmail",
    auth: {
      user: "kalkiram40@gmail.com",
      pass: "xxkubsumzrfmylet",
    },
  });

  const reqUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/${verificationToken}`;

  const mailOptions = {
    from: "kalkiram40@gmail.com",
    to: email,
    subject: "Email verfication for Book App",
    html: `<p>Verify your email!!</p>\n\n Click <a href=${reqUrl}>Here!!</a> to verify`,
  };

  await new Promise((resolve, reject) => {
    transpoter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
      } else {
        resolve(info);
      }
    });
  });
  // transpoter.sendMail(mailOptions, function (err, response) {
  //   if (err) throw err;
  //   console.log("Mail sent succeessfully");
  // });
};

const sendPasswordToken = ({ email, passwordToken, newPassword, req }) => {
  //nodemailer
  const transpoter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "Gmail",
    auth: {
      user: "kalkiram40@gmail.com",
      pass: "xxkubsumzrfmylet",
    },
  });

  const reqUrl = `${req.protocol}://${req.get(
    "host"
  )}/reset/${passwordToken}/${newPassword}`;

  const mailOptions = {
    from: "kalkiram40@gmail.com",
    to: email,
    subject: "Reset Password for Book App",
    html: `<p>Reset your password!!</p>\n\n Click <a href=${reqUrl}>Here!!</a>`,
  };

  transpoter.sendMail(mailOptions, function (err, response) {
    if (err) throw err;
    console.log("Mail sent succeessfully");
  });
};

module.exports = {
  cleanUpAndValidate,
  genrateJWTToken,
  sendVerficiationToken,
  sendPasswordToken,
};
