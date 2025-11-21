// var mysql = require("mysql");

// const con = mysql.createConnection({
//   host: process.env.DB_HOST || "mysql",
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 3306,
//   //database: "ordremissiondatabackup",
// });

// con.connect(function (err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// module.exports = con;
var mysql = require("mysql");

const con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "vasccare",
  //database: "ordremissiondatabackup",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
