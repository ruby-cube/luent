```ts


// function getCities()  {
//    await (fetchCities() ... res)
//    await (res.json() ... cities)
//       return cities;
//    catch (error) 
//       console.error(error)
// }

// function getCities()  {
//    await (fetchCities() ... res)
//    await (res.json() ... return cities)
//    catch (error) 
//       console.error(error)

//    console.log('something') // unreachable code
// }

// function getCities() {
//    return fetchCities()
//       .then(res => {
//          return res.json()
//       })
//       .catch(error => {
//          console.error(error)
//       })
// }

// function getCities() {
//    try{
//       const res = await fetchCities()
//       return await res.json()
//    }
//    catch(error) {
//       console.error(error)
//    }
// }


// function getCities()  {
//    async {
//       await fetchCities() ... (res):
//          console.log(res);
      
//       await res.json() ... (cities):
//          console.log(cities)
//          return cities;

//       catch (error):
//          console.error(error)
//    }
// }

function getCities()  {
   
   async {
      await fetchCities() ... (res):
         console.log(res);
      
      await res.json() ... (cities):
         console.log(cities)
   
      catch (error):
         console.error(error)
   }

   console.log('synchronous')
}

function getCities()  {
   await fetchCities() ... (res):
      console.log(res);
   
   await res.json() ... (cities):
      console.log(cities)
      return cities;

   catch (error):
      console.error(error)
}

function getCities()  {
   await fetchCities() ... (res):
      console.log(res);
}

function Tooltip() {

   async {
      await ($layout() ...):
         const height = $div()?.getBoundingClientRect().height;
      
      await ($render() ...):
         if (height != null) $height.value = height
   }

   return template(
      
   )
}

// function getCities()  {
//    await (fetchCities() ... res) {
//       console.log(res)
//    }
//    await (res.json() ... cities) {
//       console.log(cities)
//       return cities;
//    }
//    catch (error) 
//       console.error(error)
// }

// function getCities()  {
//    await (fetchCities() ... res)
//       console.log(res)
   
//    await (res.json() ... cities) {
//       console.log(cities)
//       return cities;
//    }
//    catch (error) 
//       console.error(error)
// }


function getCities() {
   try{
      const res = await fetchCities()
      console.log(res)

      const cities = await res.json()
      console.log(cities)

      return cities;
   }
   catch (error) {
      console.error(error)
   }
}

function getCities() {
   return fetchCities()
      .then(res => {
         console.log(res)
         return res.json()
      })
      .then(cities => {
         console.log(cities)
      })
      .catch(error => {
         console.error(error)
      })
}
```