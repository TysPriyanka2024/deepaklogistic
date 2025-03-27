const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {
  MessageConstants,
  StatusCodesConstants,
  ParamsConstants,
  
} = require('../../../managers/notify');
const secretKey = process.env.SECRET_KEY
const {
  ImgServices
} = require('../../../managers/services');
const { FamarkCloud } = require('../middlewares');
const models = require('../../../managers/models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();
const options = { day: '2-digit', month: 'short', year: 'numeric' };
const options2 = { timeZone: 'UTC', };
const axios = require('axios');


// Functions

async function getSessionId(domainName, userName, password) {
  const credential = {
      DomainName: domainName,
      UserName: userName,
      Password: password,
  };

  return await FamarkCloud.postData(
      "/Credential/Connect",
      JSON.stringify(credential),
      null
  );
}




module.exports = {

  // Get Product List
    list : async (req, res) => {
        try {
            const Vehicle = await models.BranchModel.Vehicle.find()
                .populate('branch_id')
        
            const VehicleCount = Vehicle.length;
            const user = req.user;
            if (!user) {
                return res.redirect('/admin/auth/login');
            }
            res.render('admin/vehicle/list', { Title: "Vehicle list", user, Vehicle, VehicleCount , error: "DeliveryMan List" })
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },


  // Add Category List
    getAdd : async (req, res) => {
        try{
            const user = req.user;
            const branch = await models.BranchModel.Branch.find({});
            
            if (!user) {
                return res.redirect('/admin/auth/login');
            }
    
            res.render("admin/vehicle/add",{ Title: "Vehicle Registeration",user, branch , error: "Register a Vehicle" });
        }catch(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },

  // Add Category List
    postAdd: async (req, res) => {
        try {
            const {vehicle_number, branch_id, deliveryman, phone, email , password, imei_number} = req.body;

            console.log(req.body)
            if (!vehicle_number || !branch_id || !deliveryman) {
                throw new Error('Required fields are missing.');
            }
            var is_connected = false;

            // if (imei_number !== 0) {
            //   imei_number = imei_number
            //   is_connected = true
            // }

            let vehicle_imei = imei_number;
    
            if (vehicle_imei && vehicle_imei !== 0) {
                is_connected = true;
            }

            const vehicleData = {
                vehicle_number, 
                branch_id, 
                deliveryman_id : deliveryman,
                is_available : true,
                phone, 
                email,
                imei_number : vehicle_imei,  
                password : await bcrypt.hash(password, 10),
                is_connected : is_connected
            };

            const vehicle = new models.BranchModel.Vehicle(vehicleData);
            await vehicle.save();
            console.log("Vehicle Added successfully");
            res.redirect('/admin/vehicle/list');
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },

  // Update Status
    updateStatus : async (req, res) => {
        try {
            const vehicleId = req.body.vehicleId;
            console.log(vehicleId)
            // Find the branch in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId);
        
            if (!vehicle) {
                // Branch not found in the database
                return res.status(404).send('Vehicle not found');
            }
        
            // Toggle the status (true to false or false to true) and save the updated branch
            vehicle.is_available = !vehicle.is_available;
            await vehicle.save();
            
            console.log('Database value updated successfully');
            res.json({ is_available: vehicle.is_available }); // Respond with the updated status
        } catch (err) {
          console.error('Error updating database value: ', err);
            res.status(500).send('Error updating database value');
        }
    },

  // Edit Category
    getUpdate :  async (req, res) => {
        try {
            const vehicleId = req.params.vehicleId;
            const user = req.user;
          
            const branch = await models.BranchModel.Branch.find();
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            console.log("Fetching Vehicle with ID:", vehicleId);
        
            // Find the deliveryman in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId)
                .populate('branch_id');
        
            if (!vehicle) {
              // Vehicle not found in the database
              throw new Error('Vehicle not found.');
            }
        
            // Send the deliveryman details to the client for updating
            res.render('admin/vehicle/update', { Title: "Vehicle Update",user, branch ,vehicle , error:"Update the deliveryMan" }); // Assuming you are using a template engine like EJS
          } catch (err) {
            console.log("There is an issue while fetching the Delivery Man for updating.");
            console.log(err.message);
            res.status(404).send(err.message);
          }
    },

  // Update Category
    postUpdate :  async (req, res) => {
        try {
            const vehicleId = req.params.vehicleId;
            console.log("Updating Vehicle with ID:", vehicleId);
            const {vehicle_number, branch_id, phone , email, imei_number} = req.body;
            deliveryman_id = req.body.deliveryman;
            // Find the Delivery Man in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId);
        
            if (!vehicle) {
              // Delivery Man not found in the database
              throw new Error('Delivery Man not found.');
            }

            
            console.log(imei_number);

            var is_connected = false;

            if (imei_number !== 0 && imei_number !== "0") {
              is_connected = true;
            } else {
              is_connected = false;
            }
            

            console.log(is_connected);

                vehicle.vehicle_number = vehicle_number;
                vehicle.branch_id = branch_id;
                vehicle.deliveryman_id = deliveryman_id;
                vehicle.phone = phone;
                vehicle.email = email;
                vehicle.imei_number = imei_number;
                vehicle.is_connected = is_connected;
                console.log("deliveryman_id --- 2" , deliveryman_id);
            // Save the updated Delivery Man to the database
            await vehicle.save();
            console.log("Vehicle updated successfully");
        
            res.redirect('/admin/vehicle/list?success="Delivery Man Updated Successfully"');
          } catch (err) {
            console.log("There is an issue while updating the Delivery Man details.");
            console.log(err.message);
            res.status(400).send(err.message);
          }
    },

  // Vehicle Stats
    vehicleStats : async (req, res) => {
      try {
          const vehicle = await models.BranchModel.Vehicle.find()
          .populate('deliveryman_id');
      
          const user = req.user;
          if (!user) {
              return res.redirect('/admin/auth/login');
          }
          res.render('admin/vehicle/addStats', { Title: "Vehicle list", user, vehicle , error: "DeliveryMan List" })
      } catch (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
      }
    },

    postStats : async (req, res) => {
    try{
      const {vehicle_id, order_id, fuel_capacity, fuel_dispensed, fuel_available, dispensed_datetime} = req.body;
        console.log(req.body)
      if (!vehicle_id || !order_id || !fuel_capacity  || !fuel_dispensed || !fuel_available  || !dispensed_datetime ) {
          throw new Error('Required fields are missing.');
      }

      const statsData = {
          vehicle_id, 
          order_id, 
          fuel_capacity,
          fuel_dispensed,
          fuel_available,
          dispensed_datetime
      };

      const vehicleStats = new models.BranchModel.VehicleStats(statsData);
      await vehicleStats.save();
      console.log("Vehicle Stats Added successfully");
      res.redirect('/admin/vehicle/list');
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
    },

  // Detailed Stats
    detailedStats :async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        const vehicleStats = await models.BranchModel.VehicleStats.find({vehicle : vehicleId})
            .populate('vehicle')
            .populate('order_id')

        const user = req.user;
        if (!user) {
            return res.redirect('/admin/auth/login');
        }
        res.render('admin/vehicle/detailStats', { Title: "Vehicle list", user, vehicleStats, options,  options2 , error: "DeliveryMan List" })
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
    },
    
    getStats :async (req, res) => {
      try {
        const user = req.user;
        if (!user) {
            return res.redirect('/admin/auth/login');
        }

        const vehicleId = req.params.vehicleId;

        const stats = await models.BranchModel.Dispensed.find({vehicle_id : vehicleId}).populate('vehicle_id')
      
        const total_dispensed = stats.reduce((liters, stat) => liters + parseFloat(stat.liters), 0);

        const vehicle = await models.BranchModel.Vehicle.findById(vehicleId)
        const vehicle_number = vehicle.vehicle_number
        console.log("stats", stats)

        

        res.render('admin/vehicle/detailStats', { Title: "Vehicle list",vehicle_number, user, stats, options,  options2 , total_dispensed , error: "Vehicle Stats List" })

      } catch (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
      }
    },

    getVehicleConnection :  async (req, res) => {
      try {
          const vehicleId = req.params.vehicleId;
          const user = req.user;
        
          const branch = await models.BranchModel.Branch.find();
          if (!user) {
            return res.redirect('/admin/auth/login');
          }
          console.log("Fetching Vehicle with ID:", vehicleId);
    
          const vehicle = await models.BranchModel.Vehicle.findById(vehicleId)
              .populate('branch_id');

          if (!vehicle) {
            return res.status(404).send('Vehicle not found');
          }
    
          console.log("imei_number ",vehicle.imei_number);
          
          const getRecordUrl = `http://josh.enterox.com:5111/api/?id=${vehicle.imei_number}&cmd=GetRecord&number=1`;

          try {
              // Wait for the API response before proceeding
              const response = await axios.get(getRecordUrl);
              
              if (response.data.result !== "failure") {
                  vehicle.is_connected = true;
              } else {
                  vehicle.is_connected = false;
              }
  
              console.log("Vehicle connection status:", vehicle.is_connected);
              await vehicle.save();
          } catch (apiError) {
              console.error("Error while checking vehicle connection status:", apiError.message);
          }
  
          res.render('admin/vehicle/vehicleConnection', { Title: "Vehicle Connection",user, branch ,vehicle, error :"Vehicle connection status check" });
      } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: err.message });
      }
    },

  getVehicleTrack : async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.redirect('/admin/auth/login');
        }
        const vehicle_no = req.query.vehicle_no; // Default vehicle number
        console.log("vehicle number ", vehicle_no)
        const url = `http://3.7.16.195/webservice?token=getLiveData&user=test@companysubuser5&pass=Login@123&vehicle_no=${vehicle_no}&format=json`;

        const response = await axios.get(url);
        const vehicleData = response.data.root.VehicleData[0];
        const totalFuel = vehicleData.Fuel.reduce((sum, fuel) => sum + fuel.value, 0);
        console.log("Total Fuel", totalFuel)
        console.log("Vehicle Data",vehicleData)

        if (vehicleData) {
          return res.render('admin/vehicle/vehicleTrack',{ Title: "vehicle track data",
                user,vehicle_no, 
                latitude: vehicleData.Latitude,
                longitude: vehicleData.Longitude,
                location: vehicleData.Location,
                speed: vehicleData.Speed,
                status: vehicleData.Status,
                fuel: totalFuel,
                error :"Vehicle Tracking Check" }
              )
        } else {
            res.status(404).json({ message: 'Vehicle data not found' });
        }

        console.log(vehicleData)
        return res.status(200).send({message : "vehicle track data", data : vehicleData})
      } catch (error) {
        console.error('Error fetching vehicle data:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
  } ,
};

