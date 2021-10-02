console.log('\x1B[36m%s\x1b[0m',"HyperPaint V1.0 - A powerful Luogu Painter Script");
console.log('\x1B[35m%s\x1b[0m',"By WinslowEric.CN");
var pixelPool = [];
var patternPool;
var accountPool = [];
var drawingPool = [];
var paintBoardResp;
var paintConfig;
var currentMap = [];
var drawpointIndex,currentDrawpoint;
var dateObj = new Date();
var offset;
var loopCount = 0,pointCount = 0;
var currentAccountIndex,currentAccount;
var userAgent = "NodeJS HyperPaint/V1.0 (By WinslowEric.CN)";
var __EnableLogging__ = true;//false禁用log输出
const fs = require("fs");
if(!moduleAvailable("needle")){
	console.log('\x1B[31m%s\x1b[0m',"请在本程序根目录下运行npm install needle安装needle模块！");
}
const needle = require("needle");
entry();

Array.prototype.remove = function(val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};

async function entry(){
	console.log('\x1B[34m%s\x1b[0m',"从config.json加载配置...");
	try{
		const fileConfig = JSON.parse(fs.readFileSync(__dirname+'\\config.json', function (err, data) {
			if (err) {
				console.log('\x1B[31m%s\x1b[0m',"读取config.json配置文件错误！");
			}else{
				try{
					var check = JSON.parse(data).account;
				}catch(e){
					console.log('\x1B[31m%s\x1b[0m',"config.json配置文件内没有账号信息！");
				}
				try{
					var check = JSON.parse(data).pattern;
				}catch(e){
					console.log('\x1B[31m%s\x1b[0m',"config.json配置文件内没有图案数据！");
				}
				try{
					var check = JSON.parse(data).offset;
				}catch(e){
					console.log('\x1B[31m%s\x1b[0m',"config.json配置文件内没有偏移量数据！");
				}
			}
		}));
		paintConfig = fileConfig;
		mainControlProcess();
	}catch(e){
		console.log('\x1B[31m%s\x1b[0m',"config.json配置文件存在错误！");
	}
}

if(!__EnableLogging__){
	console.log = function(){};
}

function getLogTime(){
	return "[" + (dateObj.getMonth()+1) + "/" + dateObj.getDate() + "|" + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds() + "]";
}

async function mainControlProcess(){
	accountPool = paintConfig.account;
	patternPool = paintConfig.pattern;
	offset = paintConfig.offset;
	var requestLoop = setInterval(async function(){
		pointCount = 0;
		if(accountPool.length != 0){
			loopCount++;
			await needle.request('GET', 'https://www.luogu.com.cn/paintBoard/board',{},{},
			function(error, response) {
				if (!error && response.statusCode === 200) {
					paintBoardResp = response.body;
					var mapTemp = paintBoardResp.split("\n");
					for(var i=0;i<1000;i++){
						currentMap[i] = [];
						for(var j=0;j<600;j++){
							currentMap[i][j] = colorConvert(mapTemp[i][j]);
						}
					}
					pixelPool = [];
					for(var i=0;i<patternPool.length;i++){
						if(currentMap[patternPool[i][0]+offset[0]][patternPool[i][1]+offset[1]] != patternPool[i][2]){
							pixelPool[pixelPool.length] = {
								"x" : patternPool[i][0],
								"y" : patternPool[i][1],
								"color" : patternPool[i][2],
							};
						}
					}
					if(patternPool.length != 0){
						if(accountPool.length > pixelPool.length){
							for(var i=0;i<pixelPool.length;i++){
								pointCount++;
								drawpointIndex = Math.floor(Math.random()*pixelPool.length);
								currentDrawpoint = pixelPool[drawpointIndex];
								drawRequest(
									pixelPool[drawpointIndex].x + offset[0],
									pixelPool[drawpointIndex].y + offset[1],
									pixelPool[drawpointIndex].color,
									accountPool[i]
								);
							}
						}else{
							for(var i=0;i<accountPool.length;i++){
								pointCount++;
								drawpointIndex = Math.floor(Math.random()*pixelPool.length);
								currentDrawpoint = pixelPool[drawpointIndex];
								drawRequest(
									pixelPool[drawpointIndex].x + offset[0],
									pixelPool[drawpointIndex].y + offset[1],
									pixelPool[drawpointIndex].color,
									accountPool[i]
								);
							}
						}
					}
				}else{
					console.log('\x1B[31m%s\x1b[0m',getLogTime()+"获取画板信息失败！");
				}
				console.log('\x1B[36m%s\x1b[0m',getLogTime()+"完成第"+loopCount+"次画板检查,画点数量:"+pointCount);
				});
			}else{
				console.log('\x1B[36m%s\x1b[0m',getLogTime()+"池内无可用账号，跳过检查");
			}
	},5000);
}

function drawRequest(x,y,color,cookie){
	needle.request('POST', 'https://www.luogu.com.cn/paintBoard/paint',{
		"x" : x,
		"y" : y,
		"color" : color
	},{
		headers : {
			"Host" : "www.luogu.com.cn",
			"User-Agent" : userAgent,
			"Accept" : "*/*",
			"Accept-Language" : "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
			"Accept-Encoding" : "gzip, deflate, br",
			"Connection" : "keep-alive",
			"Referer" : "https://www.luogu.com.cn/",
			"Cache-Control" : "no-cache",
			"Cookie" : cookie
		}
	},function(error, response) {
		if (!error && response.statusCode === 200) {
			accountPool.remove(cookie);
			console.log("将"+cookie+"加入冷却池");
			addAccountQueue(cookie);
		}else{
			console.log('\x1B[31m%s\x1b[0m',getLogTime()+"画点失败！");
		}
	});
}
function addAccountQueue(cooldownAccount){
	setTimeout(function(){
		accountPool[accountPool.length] = cooldownAccount;	
	},30000);
}

function colorConvert(code){
	if(isNaN(code)){
		code = code.charCodeAt() - 87;
	}
	return code;
}

function moduleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}
