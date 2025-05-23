const mongoose = require('mongoose');

const otpSchema =  mongoose.Schema({
    phone : {
        type: String,
        required: true,
    },
    otp : {
        type: String,
        required: true,
    },
    status : {
        type: String,
        required: true,
    },
    created_date:{
        type: Date,
        default: Date.now,
        index : {expires : 120}
    },
}, {timeStamp: true}
)

const VehicleOtp = mongoose.model('Vehicle-Otp', otpSchema)
   

module.exports = VehicleOtp;
