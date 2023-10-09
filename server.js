const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");
const { engine } = require('express-handlebars');
app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }))
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set("views", "./views");
app.set('view engine', '.hbs');

const mongoose = require("mongoose")

const CONNECTION_STRING = ""

mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => { console.log("Mongo DB connected successfully."); });

const Schema = mongoose.Schema
const OrderSchema = new Schema({ customerName: String, deliveryAddress: String, itemsOrdered: String, dateAndTime: String, status: String })
const DriverSchema = new Schema({ userName: String, password: String, fullName: String, vehicleModel: String, color: String, licensePlate: String })
const ItemSchema = new Schema({ itemName: String, itemImage: String, itemDisc: String, itemPrice: String })
const contactSchema = new Schema({
    name: String,
    phoneNumber: String,
    address: String,
    city: String,
    postalCode: String
});


const Order = mongoose.model("orders_collection", OrderSchema)
const Driver = mongoose.model("drivers_collection", DriverSchema)
const Item = mongoose.model("items_collection", ItemSchema)
const Contact = mongoose.model('contact_collection', contactSchema);

// ----------endpoints--------
app.get("/", async (req, res) => {
    console.log(`server started!!!`)
    const allitems = await Item.find().lean().exec();
    res.render("index", {
        layout: false,
        itemsList:allitems
    })
    // res.send(`server endpoint working `);
})

app.get("/getAllItems", async (req, res) => {
    try {
        const allitems = await Item.find().lean().exec();

        res.render('index', {
            layout: false,
            itemsList: allitems,
        })
    }
    catch (err) {
        console.log(err);
    }
})

app.get('/orderItem/:itemId/:name', (req, res) => {
    const id = req.params.itemId;
    const itmename=req.params.name;
    res.render("orderForm", {
        layout: false,
        ordreitemId: id,
        itemName:itmename,
    })
})

app.post("/orderItem/:itemId/:name", async (req, res) => {

    const orderItemId = req.params.itemId;
    const orderItemName=req.params.name;
    const name = req.body.name;
    const address = req.body.address;
    const phone = req.body.phone;
    const dateTime = new Date().toLocaleString();
    const status = "RECEIVED";
    //const itemname=await Item.find({_id:orderItemId}).lean().exec();
    
    const addorder = new Order({
        customerName: name,
        deliveryAddress: address,
        itemsOrdered: orderItemName,
        dateAndTime: dateTime,
        status: status
    })

    try {
        await addorder.save();
        console.log(`order placed ${orderItemId}`)
        res.send(`<h1>your order is placed</h1>`)
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/getAllOrders", async(req, res) => {
    try{
        const order= await Order.find().lean().exec();
        // const orderitem= await Item.find().lean().exec();
        console.log(`All orders`);
        console.log(order);
        res.render("ordersPage",{
            layout:false,
            allOrders:order,
            // orderitem:orderitem,
        })
    }
    catch(err){
        console.log(err);
    }
})

// ----------endpoints--------


const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);
