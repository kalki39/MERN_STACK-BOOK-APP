const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const clc = require("cli-color");
const bcrypt = require("bcrypt");
const {
  cleanUpAndValidate,
  sendVerficiationToken,
  genrateJWTToken,
  sendPasswordToken,
} = require("./utlis/AuthUtils");
const userSchema = require("./models/userSchema");
const { isAuthMiddleware } = require("./middlewares/isAuthMiddleware");
const validator = require("validator");
const todoSchema = require("./models/todoSchema");
const { rateLimiting } = require("./middlewares/rateLimiting");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const Product = require("./models/productModel");

//variables
const app = express();
const PORT = process.env.PORT || 8000;
const saltRound = 11; //for 11 round hash the password
const MONGO_URI =
  "mongodb+srv://kalkiram40:$Qwertyuiop99@kalkiapi.ncmqnei.mongodb.net/book_app";

//middleware it convert res.body from binary to json
app.use(express.json());
app.use(express.urlencoded({ extend: true }));
app.use(express.static("public"));

//middleware for session id
const store = new mongoDbSession({
  uri: MONGO_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "this is dashborad page session cookies",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//view engine is responseble for compile in client side like v8 in server
app.set("view engine", "ejs");

//db connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(clc.green.bold("DATABASE CONNECTED"));
  })
  .catch((err) => {
    console.log(clc.red.bold(err));
  });

// routes
app.get("/", (req, res) => {
  res.render("register");
});

app.get("/registration", (req, res) => {
  res.render("register");
});

app.post("/registration", async (req, res) => {
  const { name, email, username, password } = req.body;
  try {
    //data validation
    await cleanUpAndValidate({ name, email, username, password }); //we pass arg inside {} bracket so order of arg is any thing

    //check user already exist by email and username
    const userExistEmail = await userSchema.findOne({ email }); //syntax is findOne({email:email})
    if (userExistEmail) {
      return res.send({
        status: 400,
        message: "User already exist",
      });
    }

    const userExistUsername = await userSchema.findOne({ username });
    if (userExistUsername) {
      return res.send({
        status: 400,
        message: "Username Already exits",
      });
    }

    //hash the user password using bcrypt before store in db
    const hashPassword = await bcrypt.hash(password, saltRound);

    //store data in db
    const user = new userSchema({
      name: name,
      email: email,
      password: hashPassword,
      username: username,
    });

    try {
      const userDb = await user.save();
      console.log(userDb);
      //token genrate
      const verificationToken = genrateJWTToken(email);
      console.log(verificationToken);
      //sent mail function
      sendVerficiationToken({ email, verificationToken, req });

      console.log(userDb);
      return res.send({
        status: 200,
        message:
          "Registeration Successfull, Link has been sent to your mail id. Please verify before login",
      });
      // return res.redirect("/login");
      // return res.send({
      //   status: 201,
      //   message: "User register successfully",
      //   data: userDb,
      // });
    } catch (error) {
      return res.send({
        status: 500,
        message: "Database error",
        error: error,
      });
    }
  } catch (error) {
    return res.send({
      status: 400,
      message: "Data Invalid",
      error: error,
    });
  }
});

//verify token
app.get("/api/:token", (req, res) => {
  console.log(req.params);
  const token = req.params.token;
  const SECRET_KEY = process.env.SECRET_KEY;

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    try {
      const userDb = await userSchema.findOneAndUpdate(
        { email: decoded },
        { emailAuthenticated: true }
      );
      console.log(userDb);

      return res.status(200).redirect("/login");
    } catch (error) {
      res.send({
        status: 500,
        message: "database error",
        error: error,
      });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  //validate the data
  console.log(req.body);
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.send({
      status: 400,
      message: "missing credentials",
    });
  }

  if (typeof loginId !== "string" || typeof password !== "string") {
    return res.send({
      status: 400,
      message: "Invalid data format",
    });
  }

  //identify the loginId and search in database

  try {
    let userDb;
    if (validator.isEmail(loginId)) {
      userDb = await userSchema.findOne({ email: loginId });
    } else {
      userDb = await userSchema.findOne({ username: loginId });
    }

    if (!userDb) {
      return res.send({
        status: 400,
        message: "User not found, Please register first",
      });
    }

    //password compare bcrypt.compare
    const isMatch = await bcrypt.compare(password, userDb.password);

    if (!isMatch) {
      return res.send({
        status: 400,
        message: "Password Does not match",
      });
    }

    //Add session base auth sys
    console.log(req.session);
    req.session.isAuth = true;
    req.session.user = {
      username: userDb.username,
      email: userDb.email,
      userId: userDb._id,
    };

    // return res.send({
    //   status: 200,
    //   message: "Login Successfull",
    // });
    return res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

app.get("/forgetPassword", (req, res) => {
  // let email = prompt("Enter your registered Email");

  res.render("login");
  // res.send(req.body);
});
app.post("/forgetPassword", async (req, res) => {
  // let email = prompt("Enter your registered Email");
  // res.render("login");
  console.log(req.body);
  const { email, newPassword } = req.body;
  try {
    const userDb = await userSchema.findOne({ email: email });

    if (!userDb) {
      return res.send({
        status: 400,
        message: "Email not found, Please enter registered Email",
      });
    }
    try {
      console.log(newPassword);
      const passwordToken = genrateJWTToken(userDb.email);
      console.log(passwordToken);
      //sent mail function
      sendPasswordToken({ email, passwordToken, newPassword, req });
    } catch (error) {
      console.log(error);
    }

    return res.send({
      status: 200,
      message: "Please check email to reset password",
      data: userDb,
    });
  } catch (error) {
    res.send(error);
  }
});

//verify password reset
app.get("/reset/:token/:password", (req, res) => {
  console.log(req.params);
  const token = req.params.token;
  const newPassword = req.params.password;
  const SECRET_KEY = process.env.SECRET_KEY;

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    try {
      const hashPassword = await bcrypt.hash(newPassword, saltRound);
      const userDb = await userSchema.findOneAndUpdate(
        { email: decoded },
        { password: hashPassword }
      );
      console.log(userDb);

      return res.status(200).redirect("/login");
    } catch (error) {
      res.send({
        status: 500,
        message: "database error",
        error: error,
      });
    }
  });
});

//after user login it go to dashboard
app.get("/dashboard", isAuthMiddleware, async (req, res) => {
  //isAuth is a middleware function it check session id in cookies before going to dashboard
  console.log(req.session);
  // const username = req.session.user.username;
  return res.render("dashboard");
  //search all todo list in db of current user using name
  // try {
  //   const todos = await todoSchema.find({ username: username }); //it return all toodo in array from db
  //   console.log(todos);
  //   return res.render("dashboard", { todos: todos }); //todo array pass to dashborad html page to map all todo data
  // } catch (error) {
  //   return res.send({
  //     status: 500,
  //     message: "Database error",
  //     error: error,
  //   });
  // }
});

//logout
app.post("/logout", isAuthMiddleware, (req, res) => {
  //isAuth is a middleware function it check session id in cookies before going to dashboard
  console.log(req.session);
  req.session.destroy((err) => {
    if (err) throw err;

    return res.redirect("/login");
  });
});

//logout from all device
app.post("/logout_from_all_devices", isAuthMiddleware, async (req, res) => {
  //isAuth is a middleware function it check session id in cookies before going to dashboard

  const username = req.session.user.username;

  //creating session model
  const Schema = mongoose.Schema;

  const sessionSchema = new Schema({ _id: String }, { strict: false });

  const sessionModel = mongoose.model("session", sessionSchema); //when we create model , name should be singular -"session"

  try {
    const deleteCount = await sessionModel.deleteMany({
      //it delete all data has same username and return count
      "session.user.username": username,
    });
    return res.redirect("/login");
  } catch (error) {
    res.send({
      status: 500,
      message: "Logout failed",
      error: error,
    });
  }
});

//todo's api
app.post("/create-item", isAuthMiddleware, rateLimiting, async (req, res) => {
  //ratelimit is middleware it limit
  console.log(req.body); // 2 sec to create new todo

  const { tittle, author, price, category } = req.body; ///book is from user client

  //data validation
  if (!tittle || !author || !price || !category) {
    return res.send({
      status: 400,
      message: "missing credential",
    });
  }

  //initialize  todo schema in db

  const todo = new todoSchema({
    tittle,
    author,
    price,
    category,
    username: req.session.user.username,
  });

  try {
    const todoDb = await todo.save();
    return res.send({
      status: 200,
      message: "book created successfully",
      data: todoDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
    });
  }
  return res.send(req.body.todo);
});

//edit todo
app.post("/edit-item", isAuthMiddleware, async (req, res) => {
  console.log(req.body);

  const { id, newData } = req.body; /// using id we search in db and update the todo

  //data validation
  if (!id || !newData) {
    return res.send({
      status: 400,
      message: "missing credential",
    });
  }

  if (typeof newData != "string") {
    return res.send({
      status: 400,
      message: "invalid input",
    });
  }

  if (newData.length > 100) {
    return res.send({
      status: 400,
      message: "input length is too long",
    });
  }

  try {
    const tododb = await todoSchema.findByIdAndUpdate(
      { _id: id },
      { todo: newData }
    );

    return res.send({
      status: 200,
      message: "Todo updated successfully",
      data: tododb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
    });
  }
  return res.send(req.body.todo);
});
app.post("/delete-item", isAuthMiddleware, async (req, res) => {
  console.log(req.body);

  const { id } = req.body; /// using id we search in db and update the todo

  //data validation
  if (!id) {
    return res.send({
      status: 400,
      message: "missing credential",
    });
  }

  try {
    const tododb = await todoSchema.findOneAndDelete({ _id: id });

    return res.send({
      status: 200,
      message: "Todo deleted successfully",
      data: tododb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
    });
  }
});

app.get("/read-item", async (req, res) => {
  //this route for after user create new todo that data is stored in db
  console.log(req.session.user.username); //we need to get all todo data and send to client side to map all
  const user_name = req.session.user.username; //todo in list
  try {
    const todos = await todoSchema.find({ username: user_name });

    if (todos.length === 0)
      return res.send({
        status: 400,
        message: "Todo is empty, Please create some.",
      });

    return res.send({
      status: 200,
      message: "Read Success",
      data: todos,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

//pagination
//pagination_dashboard?skip=10
app.get("/pagination_dashboard", isAuthMiddleware, async (req, res) => {
  const skip = req.query.skip || 0; //client
  const LIMIT = 5; //backend

  const user_name = req.session.user.username;

  try {
    const todos = await todoSchema.aggregate([
      //match, pagination
      { $match: { username: user_name } },
      {
        $facet: {
          data: [{ $skip: parseInt(skip) }, { $limit: LIMIT }],
        },
      },
    ]);

    // console.log(todos[0].data);    //it retirn array of data
    return res.send({
      status: 200,
      message: "Read success",
      data: todos[0].data,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});
//get all product from db and send to client

app.get("/product/", async (req, res) => {
  try {
    let product = await Product.find({});
    if (!product) {
      return res.status(404).json({ message: `product not found` });
    }
    return res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(clc.yellow.bold("server connected "));
  console.log(clc.yellow.underline(`http://localhost:${PORT}`));
});
