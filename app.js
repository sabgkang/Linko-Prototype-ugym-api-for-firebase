var version ="V.51";

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
//http://localhost:5000/?API=01&UserId=U1001&Name=小王&Gender=男&Height=170cm&Birth=2019-01-01&Phone=095555555&ID=A120000000&Address=新竹市 東區 中央路&picUrl=www.google.com

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
//   API:13 ?API=13&UserId=U10...CDEF
//          從 UserId 查得 PhoneNumber
//
//   API:20 ?API=20&UserName&CourseId&userId&phoneNumber
//          報名寫入 courseMember with  ["courseID", ["userName", "未繳費", "未簽到"]], 成功回應 "API:20 會員報名成功" 或 "API:20 會員報名失敗"
//
//   API:30 ?API=30
//          讀取 couponData, 成功回應 JSON.stringify(couponData), 失敗回應 "API:30 couponData 讀取失敗"
//   API:31 ?API=31
//          讀取 couponHistory, 成功回應 JSON.stringify(couponHistory), 失敗回應 "API:31 couponHistory 讀取失敗"
//   API:32 ?API=32
//          讀取 couponMember, JSON.stringify(couponMember), 失敗回應 "API:32 couponHistory 讀取失敗"
//
//   API:40 ?API=40&UserName&CouponId
//          報名寫入 couponMember with  ["courseID", ["userName", "已使用", "未確認"]], 成功回應 "API:40 優惠券使用成功" 或 "API:40 優惠券使用失敗"

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
    case "13":
      console.log("呼叫 API:13 讀取 courseMember");
      getUserPhoneNUmber();  
      break;      
    case "20":
      console.log("呼叫 API:20 報名寫入 courseMember");
      writeCourseMember();  
      break;  
    case "30":
      console.log("呼叫 API:30 讀取 couponData");
      readCouponData();  
      break; 
    case "31":
      console.log("呼叫 API:31 讀取 couponHistory");
      readCouponHistory();  
      break;  
    case "32":
      console.log("呼叫 API:32 讀取 couponMember");
      readCouponMember();  
      break; 
    case "40":
      console.log("呼叫 API:40 使用寫入 couponMember");
      writeCouponMember();  
      break;      
    default:
      console.log("呼叫 未知API:"+inputParam.API);
      response.send("呼叫 未知API:"+inputParam.API);
  }

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
     if (member[6] == inputParam.UserId) {
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
     if (member[6] == inputParam.UserId) {
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

//?API=01&UserId=U1001&Name=小王&Gender=男&Height=170cm&Birth=2019-01-01&Phone=095555555&ID=A120000000&Address=新竹市 東區 中央路&picURL=www.google.com
//會員資料格式
//[
//  '盧小宏',
//  '男',
//  '1966-03-03',
//  '09XXXXXXXX',
//  'A1XXXXXXXX',
//  '新竹市',
//  'Tony',// LineId
//  'www.xxx.com', // Line URL
//]
function addAndWriteToFirebase() {
  var dataToAdd =[];
  dataToAdd = [
    inputParam.Name,
    inputParam.Gender,
    inputParam.Birth,
    inputParam.Phone,
    inputParam.ID,
    inputParam.Address,
    inputParam.UserId,    
    inputParam.PicURL, 
    inputParam.Height,
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

// 課程管理 APIs ====================================================================
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
  // 讀取目前 courseMember
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


function getUserPhoneNUmber() {
  // 讀取目前會員資料
  database.ref("users/林口運動中心/客戶管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫會員資料讀取完成");
    var result = snapshot.val();
    
    try {
      memberData = JSON.parse(result.會員資料);
      //console.log(memberData);
    } catch (e) {
      console.log("API:13 讀取資料庫失敗");
      response.send("API:13 讀取資料庫失敗");      
      return 0;
    }
    
    var userFound=false;
    memberData.forEach(function(member, index, array){
     if (member[6] == inputParam.UserId) {
       response.send(member[3]);
       userFound = true;
       return 0;
     }
    });
    
    if (!userFound) response.send("API:13 找不到 "+inputParam.UserId); 
    
  });  
}

//?API=20&UserName=小林&CourseId=U0002&UserId=U12345678901234567890123456789012&PhoneNumber=0932000000
function writeCourseMember() {
  
  // 檢查 UserName, CourseId, UserId, PhoneNumber
  var errMsg = "";
  if ( inputParam.UserName == undefined ||
       inputParam.CourseId == undefined ||
       inputParam.UserId == undefined   ||
       inputParam.PhoneNumber == undefined )
  {
    console.log("API:20 參數錯誤"); 
    response.send("API:20 參數錯誤");
    return 1;
  }  

  更新課程及報名人數();
}

async function 更新課程及報名人數(){

  var databaseRef = database.ref("users/林口運動中心/課程管理");
  try {
    const snapshot = await databaseRef.once('value');
    const result = snapshot.val();
    courseMember = JSON.parse(result.課程會員);   
  } catch (e) {
    console.log("API:20 courseMember 讀取失敗");
    response.send("API:20 courseMember 讀取失敗"); 
    return 1;
  }  
  
  // 檢查是否已報名
  var courseIndex=-1;
  var userInCourse = false;
  courseMember.forEach(function(course, index, array){
    if (course[0]==inputParam.CourseId ){
      //console.log("Course matched:", course[0]);
      courseIndex = index;
      if (course.length>1) {
        for (var i=1; i< course.length; i++) {
          //console.log(i, course[i]);
          if (course[i][4]== inputParam.PhoneNumber){
            //console.log(inputParam.UserName, "已經報名過 ", inputParam.CourseId);
            //response.send("API:20 "+inputParam.UserName+" 已經報名過 "+inputParam.CourseId);   
            userInCourse = true;
            break;
          }
        }
      }
    }
  });
  // 結束: 檢查是否已報名  
   
  // 已經報名過
  if (userInCourse) {
    console.log(inputParam.UserName, "已經報名過 ", inputParam.CourseId);
    response.send("API:20 "+inputParam.UserName+" 已經報名過 "+inputParam.CourseId); 
    return 1;
  };
  
  // CourseId 還沒被 UserPhoneNumber 報名過
  // push to courseMember    
  courseMember[courseIndex].push([inputParam.UserName, "未繳費", "未簽到", inputParam.UserId, inputParam.PhoneNumber]);  
  
  databaseRef = database.ref("users/林口運動中心/課程管理");
  try {
    const snapshot = await databaseRef.set({
      課程會員: JSON.stringify(courseMember),
    }); 
  } catch (e) {
    console.log("API:20 courseMember 寫入失敗");
    response.send("API:20 courseMember 寫入失敗"); 
    return 1;
  }
  
  // 讀取 課程資料，
  databaseRef = database.ref("users/林口運動中心/團課課程");
  try {
    const snapshot = await databaseRef.once('value');
    const result = snapshot.val();
    var courseData = JSON.parse(result.現在課程);
    var courseHistory = JSON.parse(result.過去課程);     
  }  catch (e) {
    console.log("API:20 courseData 讀取失敗");
    response.send("API:20 courseData 讀取失敗"); 
    return 1;
  }
  
  // 課程報名人數 加 1
  courseData.forEach(function(course, index, array){
    if (course[0]==inputParam.CourseId) {
      course[7]= String(parseInt(course[7])+1);
    }
  });
  //console.log(courseData);  
  
  // 將 課程資料 寫回資料庫
  try {
    const snapshot = await databaseRef.set({
      現在課程: JSON.stringify(courseData),
      過去課程: JSON.stringify(courseHistory),
    }); 
  } catch (e) {
    console.log("API:20 courseData 寫入失敗");
    response.send("API:20 courseData 寫入失敗"); 
    return 1;
  }  
   
  response.send("API:20 會員報名成功");
}

// 課程管理 APIs END=================================================================

// 優惠券管理 APIs ====================================================================
function readCouponData(){
  // 讀取目前 coupoData
  database.ref("users/林口運動中心/優惠券").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫優惠券讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {
      response.send(result.現在優惠券);     
    } catch (e) {
      console.log("API:30 couponData 讀取失敗");
      response.send("API:30 coupoData 讀取失敗");      
      return 0;
    }
    console.log("API:30 coupoData 讀取成功");   
  });  
}

function readCouponHistory(){
  // 讀取目前 coupoData
  database.ref("users/林口運動中心/優惠券").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫優惠券讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {
      response.send(result.過去優惠券);     
    } catch (e) {
      console.log("API:31 coupoHistory 讀取失敗");
      response.send("API:31 coupoHistory 讀取失敗");      
      return 0;
    }
    console.log("API:31 coupoHistory 讀取成功");   
  });  
}

function readCouponMember(){
  // 讀取目前 couponMember
  database.ref("users/林口運動中心/優惠券管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    console.log("資料庫優惠券管理讀取完成");
    var result = snapshot.val();
    //console.log(result);
    try {      
      response.send(result.優惠券會員);
    } catch (e) {
      console.log("API:32 couponMember 讀取失敗");
      response.send("API:32 couponMember 讀取失敗");      
      return 0;
    }
    console.log("API:32 couponMember 讀取成功");
       
  });  
}

function writeCouponMember() {
  // 檢查 UserName 和 CouponId ===========================================================
  var errMsg = "";
  //console.log(inputParam.UserName, inputParam.CourseId);
  if (inputParam.UserName == undefined) {
    console.log("UserName is undefined"); 
    errMsg += "UserName is undefined";
  }
  
  if (inputParam.CouponId == undefined) {
    console.log("CouponId is undefined"); 
    errMsg += " CouponId is undefined";
  }
  
  if (errMsg != "") {
    response.send(errMsg);  
    return 0;
  }
  // ====================================================================================
  
  // 讀取目前 couponMember
  database.ref("users/林口運動中心/優惠券管理").once("value").then(function (snapshot) {
    //console.log(snapshot.val());
    //console.log("資料庫優惠券管理讀取完成");
    console.log("API:40 couponMember 讀取成功");
    var result = snapshot.val();
    //console.log(result);
    try {      
      couponMember=[];
      couponMember = JSON.parse(result.優惠券會員);
      //console.log(couponMember);   
    } catch (e) {
      console.log("API:40 couponMember 讀取失敗");
      response.send("API:40 couponMember 讀取失敗");      
      return 0;
    }
    
    var couponIndex=-1;
    var userInCoupon = false;
    couponMember.forEach(function(coupon, index, array){
      if (coupon[0]==inputParam.CouponId){
        //console.log("coupon matched:", coupon[0]);
        couponIndex = index;
        if (coupon.length>1) {
          for (var i=1; i< coupon.length; i++) {
            //console.log(i, coupon[i]);
            if (coupon[i][0]== inputParam.UserName){
              //console.log(inputParam.UserName, "已經報名過 ", inputParam.CouponId);
              //response.send("API:40 "+inputParam.UserName+" 已經報名過 "+inputParam.CouponId);   
              userInCoupon = true;
              break;
            }
          }
        }
      }
    });

    if (userInCoupon) {
      console.log("API:40", inputParam.UserName, "已使用過 ", inputParam.CouponId);
      response.send("API:40 "+inputParam.UserName+" 已使用過 "+inputParam.CouponId); 
      return 0;
    };
    
    // CouponId 還沒被 UserName 使用過
    // push to courseMember    
    couponMember[couponIndex].push([inputParam.UserName, "已使用", "未確認"]);
    //console.log(couponMember);

    // Write to Database
    database.ref('users/林口運動中心/優惠券管理').set({
      優惠券會員: JSON.stringify(couponMember),
    }, function (error) {
      if (error) {
        console.log("API:40 會員使用優惠券失敗");
        response.send("API:40 會員使用優惠券失敗");      
      } else {
        console.log("API:20 會員使用優惠券成功");
        response.send("API:40 會員使用優惠券成功");
      }

    });
    
    
    
  });    
}
// 優惠券管理 APIs END=================================================================