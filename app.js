const express = require('express');
const bodyParser = require('body-parser');
const PORT = 3000;
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/todolistDB');

//  let today = new Date();
//   let options = { weekday: 'long', month: 'long', day: 'numeric' };
//   let day = today.toLocaleDateString('en-US', options);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'task1',
});

const item2 = new Item({
  name: 'task2',
});

const item3 = new Item({
  name: 'task3',
});

const defaultArrays = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model('list', listSchema);

app.get('/', (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultArrays, err => {
        if (err) {
          console.log(err);
        } else {
          console.log('array successfully inserted');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'today', newItems: foundItems });
    }
  });
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: [defaultArrays],
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newItems: foundList.items,
        });
      }
    }
  });
});
app.post('/', (req, res) => {
  const itemName = req.body.addItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;
  if (listName === 'today') {
    Item.findByIdAndRemove(checkedItemId, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("succesfully deleted checked item");
        res.redirect('/')
      }
    });
  }else{
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } },
        (err, foundList) => {
          if (!err) {
            res.redirect('/' + listName);
          }
        }
      );
  }
});

app.listen(PORT, () => {
  console.log(`Server is up and running on PORT ${PORT}`);
});
