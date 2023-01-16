const { Worker } = require("worker_threads");
const axios = require("axios");
const cheerio = require("cheerio");
const BeProducts = require("../models/BeProducts");

const connectDB = require("../config/db");
dotenv.config({ path: "../config/config.env" });
connectDB();

let workDir = __dirname + "/dbWorker.js";

const mainFunc = async (url, start_page) => {
  let res = await fetchData(url, start_page);
 if (!res.data) {
    gogo(start_page);
    console.log("Invalid data Obj");
    return;
  }
  const html = res.data;
  let dataArr = new Array();

  // mount html page to the root element
  const $ = cheerio.load(html);

  // select table classes, all table rows inside table body
  const statsTable = $("#list-content p.make-model > a.vehicle-url-link");

  //loop through all table rows and get table data
  statsTable.each(function () {
    let title = $(this)
      .text()
      .trim()
      .replace(/^\s+|\s+$|\n|\t/gm, ""); // get the text in all the td elements
    let href = "https://www.beforward.jp" + $(this).attr("href");
    let id = parseInt(href.split("/").slice(1, -1).pop());
    dataArr.push({ id, title, href });
  });

  return dataArr;
};

const gogo = async (page = null) => {
  let start_page = 1;
  while (start_page < 3) {
    const url =
      "https://www.beforward.jp/stocklist/make=/model=/mfg_year_from=/mfg_year_to=/showmore=/veh_type=/steering=/sortkey=n/keyword=/kmode=and/page=" +
      start_page;
    await mainFunc(url, start_page).then(async (res) => {
      // start worker
      //   const worker = new Worker(workDir);
      let insertData = [];
      res.map(async (r) => {
        insertData.push({
          id: r.id,
          title: r.title,
          href: r.href,
        });
      });

      await BeProducts.insertMany(data)
        .then((res) => console.log(res + "Success"))
        .catch((error) => console.log(error + "Error"));

      //   let insert_sql = `INSERT IGNORE INTO cars (id, title, href) VALUES `;
      //   insert_sql =
      //     insert_sql +
      //     res.map((r) => `(${r.id}, '${r.title}', '${r.href}')`).join(",") +
      //     ";";

      // send formatted data to worker thread
      //   worker.postMessage(insert_sql);

      // listen to message from worker thread
      //   worker.on("message", (message) => {
      //     console.log(message);
      //   });
    });
    start_page++;
    await timer(5000);
  }
  return;
};

gogo();

async function fetchData(url, page) {
  console.log("Crawling data...");
console.log(url);

  // make http call to url
  let response = await axios(url).catch((err) => {
    console.log(err);
    gogo(page);

  if (response.status !== 200) {
    console.log("Error occurred while fetching data");
    gogo(page);
    return;
  }
  return response;
}

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
