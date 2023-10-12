const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");
const session = require('express-session');
const { engine } = require('express-handlebars');
app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }))
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set("views", "./views");
app.set('view engine', '.hbs');

const mongoose = require("mongoose")

const CONNECTION_STRING = "mongodb+srv://gurpreetSingh:shivam200020@cluster0.y8ur2iz.mongodb.net/restaurantProject?retryWrites=true&w=majority&appName=AtlasApp"

mongoose.connect(CONNECTION_STRING);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => { console.log("Mongo DB connected successfully."); });

const Schema = mongoose.Schema
const OrderSchema = new Schema({ customerName: String, deliveryAddress: String, itemsOrdered: String, dateAndTime: String, status: String, total: String })
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

app.use(session({
    secret: 'final exam',
    resave: false,
    saveUninitialized: true,
}))

const ensureLogin = (req, res, next) => {
    if (req.session.isLoggedIn !== undefined &&
        req.session.isLoggedIn &&
        req.session.user !== undefined) {
        next()
    } else {
        return res.render("loginpage",
            {
                errorMsg: "You must login first",
                layout: false
            })
    }
}

// ----------endpoints--------
app.get("/", async (req, res) => {
    console.log(`server started!!!`)
    const allitems = await Item.find().lean().exec();
    res.render("index", {
        layout: "layout",
        itemsList: allitems
    })
    // res.send(`server endpoint working `);
})

app.get("/getAllItems", async (req, res) => {
    try {
        const allitems = await Item.find().lean().exec();

        res.render('index', {
            layout: "layout",
            itemsList: allitems,
        })
    }
    catch (err) {
        console.log(err);
    }
})

app.get('/orderItem/:itemId/:name', (req, res) => {
    const id = req.params.itemId;
    const itmename = req.params.name;
    res.render("orderForm", {
        layout: "layout",
        ordreitemId: id,
        itemName: itmename,
    })
})

app.post("/orderItem/:itemId/:name", async (req, res) => {

    const orderItemId = req.params.itemId;
    const orderItemName = req.params.name;
    const name = req.body.name;
    const address = req.body.address;
    const phone = req.body.phone;
    const dateTime = new Date().toLocaleString();
    const status = "RECEIVED";
    //const itemname=await Item.find({_id:orderItemId}).lean().exec();
    const orderedItemObj = await Item.findOne({ _id: orderItemId }).lean().exec();
    const price = orderedItemObj.itemPrice;
    const addorder = new Order({
        customerName: name,
        deliveryAddress: address,
        itemsOrdered: orderItemName,
        dateAndTime: dateTime,
        status: status,
        total: price
    })

    try {
        await addorder.save();
        console.log(`order placed ${orderItemId}`)
        console.log(`order id ${addorder._id}`)
        // res.send(`<h1>your order is placed</h1>`)
        const newobj = await Order.findOne({ _id: addorder._id }).lean().exec()
        console.log(newobj);
        res.render('receipt', {
            layout: false,
            receipt: newobj,
        })
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/getAllOrders", async (req, res) => {
    try {
        const order = await Order.find().lean().exec();
        // const orderitem= await Item.find().lean().exec();
        console.log(`All orders`);
        console.log(order);
        res.render("ordersPage", {
            layout: "layout",
            allOrders: order,
            // orderitem:orderitem,
        })
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/statusform", (req, res) => {
    res.render("orderStatusform", { layout: false })
})

app.post("/checkorderstatus", async (req, res) => {
    const orderid = req.body.orderid;
    if (orderid === "") {
        return res.render("orderStatusForm", {
            Msg: "please enter order id",
            layout: false
        })
    }
    try {
        const getorder = await Order.findOne({ _id: orderid }).lean().exec();
        if (getorder === "" || getorder === null || getorder === undefined) {
            return res.render("orderStatusform", {
                Msg: "No order found please enter correct orderId",
                layout: false
            })
        }
        const stat = getorder.status;
        return res.render("orderStatusForm", { Msg: stat, layout: "layout" })
    }
    catch (err) {
        console.log(err)
    }
})

app.get("/registerdriver", (req, res) => {
    res.render("driverRegistrationForm", {
        layout: "layout"
    })
})

app.post("/registerdriver", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const fullname = req.body.fullname;
    const model = req.body.vehiclemodel;
    const color = req.body.color;
    const plate = req.body.licenseplate;
    try {
        const driverobj = new Driver({
            userName: username,
            password: password,
            fullName: fullname,
            vehicleModel: model,
            color: color,
            licensePlate: plate,
        })

        const saveddata = await driverobj.save();
        console.log(`driver saved to DB`)
        console.log(saveddata)
        // res.redirect("driverloginpage");
        res.render("driverloginpage",{layout: "layout"})

    }
    catch (err) {
        console.log(err);
    }
})

app.get("/driverloginpage", (req, res) => {
    res.render("driverlogin", { layout: "layout" })
})

app.get("/updatestatus/:id", (req, res) => {
    const id=req.params.id;
    res.render("fullfilment", { layout: false, id:id })
})

app.post("/updatestatus/:id", async (req, res) => {
    const id = req.params.id;
    const status=req.body.status;
    try{
    const orderobj= await Order.findOne({_id:id}).lean().exec();
    console.log(`updatestatus objact found ${orderobj}`)
    const update={
        status:"DELIVERED",
    }
    const result= await Order.updateOne(update);
    console.log(`this order updated ${result}`)

        // res.render("ordersPagefordelivery",{layout:false})
        res.redirect("/ordersPagefordelivery")
    
    }
    catch(err){
        console.log(err);
    }
})

app.post("/login", async (req, res) => {
    const uname = req.body.username;
    const pass = req.body.password;
    try {
        const unamedb = await Driver.findOne({ userName: uname }).lean().exec();
        console.log(unamedb.userName);
        console.log(unamedb.password);

        if (uname === undefined ||
            pass === undefined ||
            uname === "" ||
            pass === "") {
            console.log(`Missing Credentials`);
            return res.render("loginpage", { layout: false })
        }

        if (uname === unamedb.userName &&
            pass === unamedb.password) {
            console.log(`Login User is ${unamedb.userName}`);

            req.session.user = {
                uname: unamedb.userName,
                pswd: unamedb.password,
            }

            req.session.isLoggedIn = true
            req.session.username = unamedb.userName


            res.redirect("/ordersPagefordelivery")
        }

        else {
            console.log(`User not found. Please try again!`);
            return res.render("loginpage",
                {
                    errorMsg: "Invalid credentials. User not found!",
                    layout: false
                })
        }
    }
    catch (err) {
        console.log(err);
    }
})

app.get("/ordersPagefordelivery", ensureLogin,async (req, res) => {
    try {
        const order = await Order.find().lean().exec();
        // const orderitem= await Item.find().lean().exec();
        console.log(`All orders`);
        console.log(order);
        res.render("ordersPagefordelivery", {
            layout: "layout",
            allOrders: order,
            // orderitem:orderitem,
        })
    }
    catch (err) {
        console.log(err);
    }
})

// ----------endpoints--------


const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);
