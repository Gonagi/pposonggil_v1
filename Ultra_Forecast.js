// 초단기예보
// 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)

const { response } = require('express');
const fetch = require('node-fetch');
const calculate = require('./cal_time_date.js');

const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';
const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'; // 초단기예보 URL
const url2 = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';// 초단기실황 URL

function fetch_ultra_forecast_data(queryParams) {   // 초단기예보
    return fetch(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}
function fetch_ultra_nowcast_data(prevQueryParams) {    // 초단기실황
    return fetch(url2 + '?' + prevQueryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}
const ultra_forecast_datas = {};

async function get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y) {
    const {
        cur_base_time,  //  input_time과 가장 가까운 base_time
        cur_base_date,  //  input_date
    } = calculate.get_basetime_basedate(input_date, input_time, 60, 100);
    // 초단기예측 API제공시간 : 1시간 주기로 매 40분 --> time_to_add를 60, time_to_divide를 100으로 한다.

    const queryParams = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: cur_base_date,
        base_time: cur_base_time,
        nx: input_x,
        ny: input_y
    });

    // 초단기예측 6시간 결과
    // 1100 ~ 1144 --> 초단기예측(base_time : 1000) --> 11, 12, 13, 14, 15, 16
    // 1200 ~ 1244 --> 초단기예측(base_time : 1100) --> 12, 13, 14, 15, 16, 17
    if (input_time % 100 < 45) {    // (1, 3)
        const items = await fetch_ultra_forecast_data(queryParams);

        items.forEach(item => {
            const fcstTime = item.fcstTime;
            if (!ultra_forecast_datas[fcstTime])
                ultra_forecast_datas[fcstTime] = {};     // 예보시간에 따른 날씨데이터 객체 생성

            // 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)
            if (item.category === "T1H" || item.category === "RN1" || item.category === "SKY" ||
                item.category === "REH" || item.category === "PTY" || item.category === "WSD"
            ) {
                if (item.category === "RN1" && item.fcstValue === '강수없음')  // 강수없음 --> 0
                    ultra_forecast_datas[fcstTime][item.category] = '0';
                else
                    ultra_forecast_datas[fcstTime][item.category] = item.fcstValue;
            }

        });
    }

    // 초단기실황 결과 1개 + 초단기예측 결과 5개
    // 1145 ~ 1159 --> 초단기실황(base_time : 1100) --> 11
    //                 + 초단기예측(base_time : 1100) --> 12, 13, 14, 15, 16
    // 1245 ~ 1259 --> 초단기실황(base_time : 1200) --> 12
    //                 + 초단기예측(base_time : 1200) --> 13, 14, 15, 16, 16
    else {
        const {
            cur_base_time,  //  input_time과 가장 가까운 base_time
            cur_base_date,  //  input_date
        } = calculate.get_basetime_basedate(input_date, input_time, 55, 100);
        // 초단기실황 API제공시간 : 1시간 주기로 매 45분 --> time_to_add를 55, time_to_divide를 100으로 한다.

        const prevQueryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time,
            nx: input_x,
            ny: input_y
        });

        //초단기실황 1개
        const ultra_nowcast_data = await fetch_ultra_nowcast_data(prevQueryParams);
        const items = ultra_nowcast_data;

        items.forEach(item => {
            if (!ultra_forecast_datas[cur_base_time])
                ultra_forecast_datas[cur_base_time] = {};       // 예보시간에 따른 날씨데이터 객체 생성

            // 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)
            if (item.category === "T1H" || item.category === "RN1" ||
                item.category === "REH" || item.category === "WSD") {
                if (item.category === "RN1" && item.obsrValue === '강수없음')   // 강수없음 --> 0
                    ultra_forecast_datas[cur_base_time][item.category] = '0';
                else
                    ultra_forecast_datas[cur_base_time][item.category] = item.obsrValue;
            }
        });

        // 초단기예보 5개
        const ultra_forecast_data = await fetch_ultra_forecast_data(queryParams);
        const items2 = ultra_forecast_data;

        let check = 0;
        items2.forEach(item => {
            const fcstTime = item.fcstTime;
            if ((check + 1) % 6 === 0) {    // 6번째 시각 필요없음
                check++;
                return;
            }

            if (!ultra_forecast_datas[fcstTime])
                ultra_forecast_datas[fcstTime] = {};       // 예보시간에 따른 날씨데이터 객체 생성

            // 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)
            if (item.category === "T1H" || item.category === "RN1" || item.category === "SKY" ||
                item.category === "REH" || item.category === "PTY" || item.category === "WSD"
            ) {
                ultra_forecast_datas[fcstTime][item.category] = item.fcstValue;

                if (item.category === "RN1" && item.fcstValue === '강수없음')
                    ultra_forecast_datas[fcstTime][item.category] = '0';
            }
            check++;
        });
    }
    return ultra_forecast_datas;
}

module.exports = {
    get_Ultra_Forecast_Data: get_Ultra_Forecast_Data
};

// 사용 예시
const input_date = '20230725'
const input_time = '1454';
const input_x = '59';
const input_y = '125';


get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y)
    .then(ultra_forecast_datas => {
        console.log(ultra_forecast_datas);
    })
    .catch(error => {
        console.error(error);
    });