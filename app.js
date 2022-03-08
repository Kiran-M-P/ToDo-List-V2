const express = require("express");
const _ = require("lodash");

// creating express application
const app = express();

//  middleware for parsing bodies from URL
app.use(express.urlencoded({ extended: true }));

// o serve static files such as images, CSS files, and JavaScript files
app.use(express.static("public"));

// setup view engine as ejs
app.set("view engine", "ejs");

// requiring mongoose
const mongoose = require("mongoose");
main().catch((err) => console.log(err));

// connecting to db
async function main() {
  await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
}

// items schema
const itemSchema = new mongoose.Schema({
  name: String,
  checkbox: Number,
});

// items model ~ collection
const Item = mongoose.model("Item", itemSchema);

// default documents
const item1 = new Item({
  name: "+ => adds a task",
  checkbox: 0,
});

const item2 = new Item({
  name: "X => deletes a task",
  checkbox: 0,
});

const item3 = new Item({
  name: "checkbox => marks as done",
  checkbox: 1,
});

const item4 = new Item({
  name: "can't delete default list",
  checkbox: 0,
});

// documents array
const defaultItems = [item1, item2, item3, item4];

// list schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

// list model
const List = mongoose.model("List", listSchema);

// root route get
app.get("/", function (req, res) {
  // find items ~ accesss
  Item.find({}, (err, foundItem) => {
    if (foundItem.length === 0) {
      // adding default items
      Item.insertMany(defaultItems, function (err) {
        if (!err) {
          res.redirect("/");
        }
      });
    } else {
      List.find({}, (err, foundLists) => {
        if (!err) {
          res.render("list", {
            listTitle: "todo",
            newListItems: foundItem,
            allList: foundLists,
          });
        }
      });
    }
  });
});

// root route post
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list.trim();

  const itemToAdd = new Item({
    name: itemName,
    checkbox: 0,
  });
  if (listName === "todo") {
    // adding user data to defatul page DB
    itemToAdd.save(() => res.redirect("/"));
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(itemToAdd);
      foundList.save(() => res.redirect("/lists/" + listName));
    });
  }
});

// strike route post --- to mark as done
app.post("/strike", (req, res) => {
  const id = req.body.id;
  const state = req.body.checkbox;
  const listName = req.body.listName.trim();

  if (listName === "todo") {
    // updating checkbox's state to DB
    Item.findByIdAndUpdate(id, { checkbox: state }, (err, docs) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (!err) {
        foundList.items.id(id).checkbox = state;
        foundList.markModified("items");
        foundList.save(() => res.redirect("/lists/" + listName));
      }
    });
  }
});

// delete route
app.post("/delete", (req, res) => {
  const id = req.body.delete;
  const listName = req.body.listName.trim();
  if (listName === "todo") {
    Item.findByIdAndDelete(id, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: id } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/lists/" + listName);
        }
      }
    );
  }
});

// delete list route
app.post("/deletelist", (req, res) => {
  const listToDelete = req.body.deleteList;
  if (listToDelete === "todo") {
    res.redirect("/");
  } else {
    List.deleteOne({ name: listToDelete }, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  }
});

// route parameters
app.get("/lists/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  // checking for existing list
  List.findOne({ name: customListName }, (err, foundList) => {
    if (foundList) {
      List.find({}, (err, foundLists) => {
        if (!err) {
          // show an existing list
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
            allList: foundLists,
          });
        }
      });
    } else {
      // create a new list
      const list = new List({
        name: customListName,
        items: [],
      });
      list.save(() => res.redirect("/lists/" + customListName));
    }
  });
});

// new list route
app.post("/newList", (req, res) => {
  const newListName = req.body.newListName;
  res.redirect("/lists/" + newListName);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
// localhost 3000
app.listen(port, () => console.log("sever has strated successfully."));
