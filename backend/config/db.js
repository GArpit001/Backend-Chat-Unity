import mongoose from "mongoose"

const connectDB = async () =>{

   let  URL = process.env.MONGO_URI

    try {
        const conn = await mongoose.connect(URL)
        console.log(`Connect to MongoDb Successfully ${conn.connection.host}` .blue)
    } catch (error) {
            console.log(`Connection Failed ${error.message}` .red.bold )
            process.exit()
    }
}

export default connectDB