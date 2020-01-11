var express = require('express');
var app = express();
var port = process.env.PORT || 5000

var response;
var inputParam;
var memberData = [];
var courseMember = [];
var memberAlreadyExist = false;

// express 設定
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next()
});

//測試時用 browser 訪問以下 URL
//http://localhost:5000/?API=01&UserId=12345&Name=小王&Gender=男&Birth=2019-01-01&Phone=095555555&ID=A120000000&Address=新竹市 東區 中央路

// 處理 API
//   API:00 ?API=00&UserId=Uxxx..xxx 
//          檢查會員 成功回應 "API:00 會員已存在" 或 "API:00 會員不存在"
//   API:01 ?API=01&UserId=12345&Name=小王&Gender=男&Birth=2019-01-01&Phone=095555555&ID=A120000000&Address=新竹市 東區 中央路
//          加入會員 成功回應 "API:01 會員已存在" 或 "API:01 會員寫入成功"
//
//   API:10 ?API=10
//          讀取 courseData, 成功回應 JSON.stringify(courseData), 失敗回應 "API:10 courseData 讀取失敗"
//   API:11 ?API=11
//          讀取 courseHistory, 成功回應 JSON.stringify(courseHistory), 失敗回應 "API:11 courseHistory 讀取失敗"
//   API:12 ?API=12
//          讀取 courseMember, JSON.stringify(courseMember), 失敗回應 "API:12 courseHistory 讀取失敗"
//
//   API:20 ?API=20&UserName&CourseId
//          報名寫入 courseMember with  ["courseID", ["userName", "未繳費", "未簽到"]], 成功回應 "API:20 會員報名成功" 或 "API:20 會員報名失敗"

app.get('/', function (req, res) {
  //console.log(req.query);
  inputParam = req.query;
  response = res;

  // 若無 API 參數，無效退出
  if (typeof inputParam.API == "undefined") {
    console.log("Error: No API");
    response.send("Error: No API");
    return 0;
  }    
  
  //console.log("API is ", inputParam.API);
  
  switch(inputParam.API) {
    case "00":
      console.log("呼叫 API:00 檢查會員");
      checkMember();
      break;
    case "01":
      console.log("呼叫 API:01 加入會員");
      addMember();  
      break; 
    case "10":
      console.log("呼叫 API:10 讀取 courseData");
      readCourseData();  
      break; 
    case "11":
      console.log("呼叫 API:11 讀取 courseHistory");
      readCourseHistory();  
      break;  
    case "12":
      console.log("呼叫 API:12 讀取 courseMember");
      readCourseMember();  
      break; 
    case "20":
      console.log("呼叫 API:20 報名寫入 courseMember");
      writeCourseMember();  
      break;       
    default:
      console.log("呼叫 未知API:"+inputParam.API);
      response.send("呼叫 未知API:"+inputParam.API);
  }

// previous implement by if
//  if (inputParam.API == "01") {
//    console.log("add Member");
//    addMember();   
//    return 0;
//  }
});



app.listen(port, function () {
  console.log('App listening on port: ', port);
});
// express 設定結束

// Firebase 設定
var admin = require("firebase-admin");

var serviceAccount = require("./webchallenge-c16eb-firebase-adminsdk-brsl0-6086bf706f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://webchallenge-c16eb.firebaseio.com"
});


var database = admin.database(); // 初始資料庫
// Firebase 設定結束

// 檢查會員是否已存在
function checkMember(){
  memberAlreadyExist = false;
  // 讀取目前會員資料
  database.ref("users/林口運動中心/客戶管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫會員資料讀取完成");
    var result = snapshot.val();
    
    try {
      memberData = JSON.parse(result.會員資料);
      //console.log(memberData);
    } catch (e) {
      console.log("API:00 讀取資料庫失敗");
      response.send("API:00 讀取資料庫失敗");      
      return 0;
    }
    
    memberData.forEach(function(member, index, array){
     if (member[1] == inputParam.UserId) {
       memberAlreadyExist = true;
     }
    });
    
    if (memberAlreadyExist) {
      response.send("API:00 會員已存在");
    } else {
      response.send("API:00 會員不存在");      
    }
  });
}

// 增加新會員到資料庫
function addMember() {
  // 讀取目前會員資料
  database.ref("users/林口運動中心/客戶管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫會員資料讀取完成");
    var result = snapshot.val();
    
    try {
      memberData = JSON.parse(result.會員資料);
      //console.log(memberData);
    } catch (e) {
      console.log("API:01 讀取資料庫失敗");
      response.send("API:01 讀取資料庫失敗");      
      return 0;
    }
    
    // 檢查是否有相同的名字及 LineId
    memberAlreadyExist = false;
    memberData.forEach(function(member, index, array){
     if (member[1] == inputParam.UserId) {
       memberAlreadyExist = true;
     }
    });   
    
    if (memberAlreadyExist) {
      response.send("API:01 會員已存在");
    } else {
      // 呼叫寫入資料庫涵式
      console.log("API:01 會員不存在，寫入新會員");
      addAndWriteToFirebase()     
    }    
  });
}

//會員資料格式
//[
//  '盧小宏',
//  'Tony',
//  '男',
//  '1966-03-03',
//  '09XXXXXXXX',
//  'A1XXXXXXXX',
//  '新竹市',
//  '180cm',
//  'URL of LINE 頭像'
//]
function addAndWriteToFirebase() {
  var dataToAdd =[];
  dataToAdd = [
    inputParam.Name,
    inputParam.UserId,
    inputParam.Gender,
    inputParam.Birth,
    inputParam.Phone,
    inputParam.ID,
    inputParam.Address,
    inputParam.Height,
    inputParam.PicURL
  ];

  memberData.push(dataToAdd);

  console.log(memberData[memberData.length-1]);
  
  database.ref('users/林口運動中心/客戶管理').set({
    會員資料: JSON.stringify(memberData),
  }, function (error) {
    if (error) {
      console.log("API:01 會員寫入失敗");
      response.send("API:01 會員寫入失敗");      
    } else {
      console.log("API:01 會員寫入成功");
      response.send("API:01 會員寫入成功");
    }

  });
}

function readCourseData(){
  // 讀取目前 courseData
  database.ref("users/林口運動中心/團課課程").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫團課課程讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {
      //var courseData = JSON.parse(result.現在課程);
      //console.log(courseData);
      response.send(result.現在課程);     
    } catch (e) {
      console.log("API:10 courseData 讀取失敗");
      response.send("API:10 courseData 讀取失敗");      
      return 0;
    }
    console.log("API:10 courseData 讀取成功");   
  });  
}

function readCourseHistory(){
  // 讀取目前 courseData
  database.ref("users/林口運動中心/團課課程").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫團課課程讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {
      response.send(result.過去課程);     
    } catch (e) {
      console.log("API:11 courseHistory 讀取失敗");
      response.send("API:11 courseHistory 讀取失敗");      
      return 0;
    }
    console.log("API:11 courseHistory 讀取成功");   
  });  
}

function readCourseMember(){
  // 讀取目前 courseData
  database.ref("users/林口運動中心/課程管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    //console.log("資料庫課程管理讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {      
      response.send(result.課程會員);
    } catch (e) {
      console.log("API:12 courseMember 讀取失敗");
      response.send("API:12 courseMember 讀取失敗");      
      return 0;
    }
    console.log("API:12 courseMember 讀取成功");
       
  });  
}

function writeCourseMember() {
  // 檢查 UserName 和 CourseId ===========================================================
  var errMsg = "";
  //console.log(inputParam.UserName, inputParam.CourseId);
  if (inputParam.UserName == undefined) {
    console.log("UserName is undefined"); 
    errMsg += "UserName is undefined";
  }
  
  if (inputParam.CourseId == undefined) {
    console.log("CourseId is undefined"); 
    errMsg += " CourseId is undefined";
  }
  
  if (errMsg != "") {
    response.send(errMsg);  
    return 0;
  }
  // ====================================================================================
  
  // 讀取目前 courseData
  database.ref("users/林口運動中心/課程管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    //console.log("資料庫課程管理讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {      
      courseMember=[];
      courseMember = JSON.parse(result.課程會員);
      //console.log(courseMember);   
    } catch (e) {
      console.log("API:20 courseMember 讀取失敗");
      response.send("API:20 courseMember 讀取失敗");      
      return 0;
    }
    console.log("API:20 courseMember 讀取成功");
    
    var courseIndex=-1;
    var userInCourse = false;
    courseMember.forEach(function(course, index, array){
      if (course[0]==inputParam.CourseId ){
        //console.log("Course matched:", course[0]);
        courseIndex = index;
        if (course.length>1) {
          for (var i=1; i< course.length; i++) {
            //console.log(i, course[i]);
            if (course[i][0]== inputParam.UserName){
              //console.log(inputParam.UserName, "已經報名過 ", inputParam.CourseId);
              //response.send("API:20 "+inputParam.UserName+" 已經報名過 "+inputParam.CourseId);   
              userInCourse = true;
              break;
            }
          }
        }
      }
    });

    if (userInCourse) {
      console.log(inputParam.UserName, "已經報名過 ", inputParam.CourseId);
      response.send("API:20 "+inputParam.UserName+" 已經報名過 "+inputParam.CourseId); 
      return 0;
    };
    // CourseId 還沒被 UserName 報名過
    // push to courseMember    
    courseMember[courseIndex].push([inputParam.UserName, "未繳費", "未簽到"]);

    // Write to Database
    database.ref('users/林口運動中心/課程管理').set({
      課程會員: JSON.stringify(courseMember),
    }, function (error) {
      if (error) {
        console.log("API:20 會員報名失敗");
        response.send("API:20 會員報名失敗");      
      } else {
        console.log("API:20 會員報名成功");
        response.send("API:20 會員報名成功");
      }

    });
    
    // API 回應成功
    //response.send("API:20 "+inputParam.UserName+" 報名 "+inputParam.CourseId+" 成功"); 
    
    
  });    
}