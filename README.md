# ugym-api-for-firebase
APIs <br>
  * API:00 ?API=00&UserId=Uxxx..xxx 
    * 檢查會員 成功回應 "API:00 會員已存在" 或 "API:00 會員不存在" 
    <br>
  * API:01 ?API=01&UserId=12345&Name=小王&Gender=男&Birth=2019-01-01&Phone=095555555&ID=A120000000&Address=新竹市 東區 中央路
    * 加入會員 成功回應 "API:01 會員已存在" 或 "API:01 會員寫入成功"
    <br>
  * API:10 ?API=10
    * 讀取 courseData, 成功回應 JSON.stringify(courseData), 失敗回應 "API:10 courseData 讀取失敗"
    <br>
  * API:11 ?API=11
    * 讀取 courseHistory, 成功回應 JSON.stringify(courseHistory), 失敗回應 "API:11 courseHistory 讀取失敗"
    <br>
  * API:12 ?API=12
    * 讀取 courseMember, JSON.stringify(courseMember), 失敗回應 "API:12 courseHistory 讀取失敗"
    <br>
  * API:20 ?API=20&UserName&CourseId
    * 報名寫入 courseMember with  ["courseID", ["userName", "未繳費", "未簽到"]], 成功回應 "API:20 會員報名成功" 或 "API:20 會員報名失敗"
    <br>
  * API:30 ?API=30
    * 讀取 couponData, 成功回應 JSON.stringify(couponData), 失敗回應 "API:30 couponData 讀取失敗"
    <br>
  * API:31 ?API=31
    * 讀取 couponHistory, 成功回應 JSON.stringify(couponHistory), 失敗回應 "API:31 couponHistory 讀取失敗"
    <br>
  * API:32 ?API=32
    * 讀取 couponMember, JSON.stringify(couponMember), 失敗回應 "API:32 couponHistory 讀取失敗"
    <br>
  * API:40 ?API=40&UserName&CouponId
    * 報名寫入 couponMember with  ["courseID", ["userName", "已使用", "未確認"]], 成功回應 "API:40 優惠券使用成功" 或 "API:40 優惠券使用失敗"
