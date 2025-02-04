class Car {
   constructor(make, model, year, mileage = 0, fuelLevel = 100) {
      this.make = make;
      this.model = model;
      this.year = year;
      this.mileage = mileage;
      this.fuelLevel = fuelLevel;
   }

   start() {
      console.log(`${this.make} ${this.model} is starting...`);
   }

   stop() {
      console.log(`${this.make} ${this.model} is stopping...`);
   }

   drive(distance) {
      if (this.fuelLevel > 0) {
         this.mileage += distance;
         this.fuelLevel -= distance * 0.05; // Assuming 1 unit of fuel per 20 miles
         console.log(`You drove ${distance} miles. Mileage is now ${this.mileage} miles.`);
      } else {
         console.log('Not enough fuel to drive.');
      }
   }

   refuel(amount) {
      this.fuelLevel += amount;
      console.log(`Refueled ${amount}%. Fuel level is now ${this.fuelLevel}%.`);
   }

   getCarInfo() {
      return `${this.year} ${this.make} ${this.model}, Mileage: ${this.mileage} miles, Fuel Level: ${this.fuelLevel}%`;
   }
}

function createCar() {

   return new Car('Toyota', 'Corolla', 2021, 5000, 100);
}

function createProperties() {
   return {
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      mileage: 5000,
      fuelLevel: 100
   }
}

function createProto() {
   return {
      start: function () {
         console.log(`${this.make} ${this.model} is starting...`);
      },

      stop: function () {
         console.log(`${this.make} ${this.model} is stopping...`);
      },

      drive: function (distance) {
         if (this.fuelLevel > 0) {
            this.mileage += distance;
            this.fuelLevel -= distance * 0.05; // Assuming 1 unit of fuel per 20 miles
            console.log(`You drove ${distance} miles. Mileage is now ${this.mileage} miles.`);
         } else {
            console.log('Not enough fuel to drive.');
         }
      },

      refuel: function (amount) {
         this.fuelLevel += amount;
         console.log(`Refueled ${amount}%. Fuel level is now ${this.fuelLevel}%.`);
      },

      getCarInfo: function () {
         return `${this.year} ${this.make} ${this.model}, Mileage: ${this.mileage} miles, Fuel Level: ${this.fuelLevel}%`;
      }
   }
}

function extendTarget(target, proto) {
   Object.setPrototypeOf(proto, Object.getPrototypeOf(target))
   Object.setPrototypeOf(target, proto)
   return target
}

function createProxy(target) {
   return new Proxy(target, {
      get(target, key, receiver) {
         if (key in target)
            return Reflect.get(target, key, receiver)
      },
      set(target, key, value, receiver) {
         target[key] = value;
         return true;
      }
   })
}

const proxy = createProxy(createCar())

function getProxy() {
   return proxy
}

const extended = extendTarget(createProperties(), createProto())

function getExtendedObject() {
   return extended
}

object.drive
object.start
object.stop
object.refuel
object.getCarInfo

object.make
object.model
object.year
object.mileage
object.fuelLevel