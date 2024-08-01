const http = require("http");
const fs = require("fs");

const requestCounter = new Map();
let count = 0;

// Creating a server.
const server = http.createServer(function (req, res) {
  // Object holding info regd the request.
  const request_info = {
    request_received_date: new Date().getDate(),
    request_received_time: new Date().getTime(),
    request_received_on_ip: req.socket.localAddress,
    request_received_path: req.url,
  };

  // Implementing try catch block, to catch the error and log that error message
  // in the error.txt file.
  try {
    // "/favicon.ico" call is getting made by default.
    // Hence avoiding it in this condition.
    if (request_info.request_received_path === "/favicon.ico") return;

    // If the request made is a valid one.
    // if condition runs.
    // else blocking user happens.
    if (isValidRequest(request_info)) {
      count++;
      console.log("----------------", count, "---------------");
      console.table(request_info); // Task - 2.
      sendResponse(req.url, res, request_info);
    } else {
      if (!requestCounter.get(request_info.request_received_on_ip).isBlocked) {
        // Block the user.
        console.log("You are blocked!👻🔒");
        requestCounter.get(
          request_info.request_received_on_ip
        ).isBlocked = true;
        // Granting access to user again after certain seconds.
        removeBlock(request_info, requestCounter);
      }
      res.end("You are blocked!");
    }
  } catch (error) {
    // If any internal error happens.
    // This block gets run and error message got printed in error.txt
    res.statusCode = 500;
    request_info.status_code = 500;
    fs.appendFileSync("error.txt", `${error.message}\n`); // Task - 3.
    res.end();
  }
});

// The function to remove the block of user.
const removeBlock = (data, hashMap) => {
  setTimeout(() => {
    hashMap.get(data.request_received_on_ip).request_count = 0;
    hashMap.get(data.request_received_on_ip).isBlocked = false;
  }, 3000);

  clearTimeout();
};

// This function checks the user request is valid or not.
const isValidRequest = (data) => {
  if (requestCounter.has(data.request_received_on_ip)) {
    // check if already in block state.
    if (requestCounter.get(data.request_received_on_ip).isBlocked) return false;
    // The IP is present in HashMap.
    const prev_req_date = requestCounter.get(
      data.request_received_on_ip
    ).request_date;
    if (data.request_received_date != prev_req_date) {
      // Request made on different date.
      requestCounter.get(data.request_received_on_ip).request_count = 1;
      requestCounter.get(data.request_received_on_ip).request_date =
        data.request_received_date;
      requestCounter.get(data.request_received_on_ip).request_time =
        data.request_received_time;
      requestCounter.get(data.request_received_on_ip).request_difference =
        calculateTimeDifference(
          data.request_received_time,
          requestCounter.get(data.request_received_on_ip)
        );
      return true;
    } else {
      // If both dates are equal.
      const prev_req_time = requestCounter.get(
        data.request_received_on_ip
      ).request_time;
      const time_difference = calculateTimeDifference(
        data.request_received_time,
        prev_req_time
      );

      if (time_difference <= 60) {
        // If time difference is less than a minute.
        // check for the count.
        if (
          requestCounter.get(data.request_received_on_ip).request_count < 10
        ) {
          // increase the request count.
          requestCounter.get(data.request_received_on_ip).request_count += 1;
          requestCounter.get(data.request_received_on_ip).request_time =
            data.request_received_time;
          requestCounter.get(data.request_received_on_ip).request_difference =
            time_difference;
          return true;
        } else {
          // block the user
          return false;
        }
      } else {
        // If time difference is greate than a minute.
        requestCounter.get(data.request_received_on_ip).request_count = 1;
        requestCounter.get(data.request_received_on_ip).request_time =
          data.request_received_time;
        requestCounter.get(data.request_received_on_ip).request_difference =
          time_difference;
        return true;
      }
    }
  } else {
    // The IP is not present in HashMap.
    // creating a new one in HashMap.
    requestCounter.set(data.request_received_on_ip, {
      request_date: data.request_received_date,
      request_time: data.request_received_time,
      request_count: 1,
      isBlocked: false,
      request_difference: null,
    });
    return true;
  }
};

// Simple function to calculate the seconds diff between new Date().getTime().
const calculateTimeDifference = (time1, time2) => {
  return Math.abs((time1 - time2) / 1000);
};

// This function sends a response to the user according to the path provided.
const sendResponse = (pathname, response, request_info) => {
  switch (pathname) {
    case "/home":
      response.statusCode = 200;
      request_info.status_code = 200;
      response.end("Welcome to Home Page!");
      break;
    case "/career":
      response.statusCode = 200;
      request_info.status_code = 200;
      response.end("Welcome to careers page!");
      break;
    case "/contact":
      response.statusCode = 200;
      request_info.status_code = 200;
      response.end("Welcome to contact page!");
      break;
    default:
      response.statusCode = 404;
      request_info.status_code = 404;
      response.end("404 - Page not found!");
  }
};

// The server is listening to the port 8000.
// The callback function prints the message in the console.
server.listen(8000, () => {
  console.log("Server started successfully!");
});

/*  structure of map:

    key: "ip_address" => value: {
        request_date : dd/mm/yyyy,
        request_time : 00:00:00,
        request_count : 0
        isBlocked : boolean.
        request_difference : 0
    }

    request_date : stores the last requested date.
    request_time : stores the last requested time.
    request_count : stores the number of request user made.
    isBlocked : determines the user is in block or not.
    request_difference : store the times difference in seconds between prev request and curr request.

    Overview on block
    1. If the ip is not in map add them to the map and assign the request count as 1.
    2. If the ip is in map:
        2.1 check for the date.
        2.2 if date is different make the request count to be 1 (because that is the first request made on that day).
        2.3 if date is same, check for time.
        2.4 if time is greater than a minute, make the request count to be 1 (because the prev request was made 1 minute ago).
        2.5 if time is less than a minute/
            2.5.1 if request count is less than 10. (initiate a request and inc count by +1).
            2.5.2 if request count is equal to 10. (block the user for 2 mins and make the count of that ip to 0 or del the ip from map).
*/
