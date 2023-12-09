import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import { dfs_xy_conv } from './convert_XY.js';

class Place {
  constructor(Name, Address, X, Y, Lat, Lon) {
    this.Name = Name;
    this.Address = Address;
    this.X = X;
    this.Y = Y;
    this.Lat = Lat;
    this.Lon = Lon;
  }
}

export async function GetPOI(input) {
  //2023.12.09. 이경호
  //url API Gateway 주소로 수정
  const url = `https://dydtkwk.ddns.net/api/POI?query=${encodeURIComponent(input)}`;

  try {
    const response = await axios.get(url);
    if (response.status == 200) {
      const Places = [];
      console.log(response.data.documents);
      response.data.documents.forEach(place => {
        const location = dfs_xy_conv("toXY", place.y, place.x);
        const aPlace = new Place(place.place_name, place.address_name, location.x, location.y, location.lat, location.lon);
        Places.push(aPlace);
      });
      return Places;
    }
    else {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    }
  } catch (err) {
    if (err.response) {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    } else if (err.request) {
      console.error(`네트워크 문제 : ${err.message}`);
    } else
      console.error(`오류 발생 : ${err.message}`);
  }
}