import { app } from "./app";

(() => {
  try {
    app.start()
  } catch (error) {
    console.log(error)
  }
})()