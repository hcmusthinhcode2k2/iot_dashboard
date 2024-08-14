"use client";
import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Icons } from "./icons";
import {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  Autoplay,
  Parallax,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { loginTb } from "@/actions";
import { readSetting } from "@/actions";

export function Footer() {
  const [temperature, setTemperature] = useState({ value: 0, timestamp: "" });
  const [temperatureData, setTemperatureData] = useState<Array<{ value: number; timestamp: string }>>([]);
  const [humidity, setHumidity] = useState({ value: 0, timestamp: "" });
  const [pressure, setPressure] = useState({ value: 0, timestamp: "" });
  const [rainRate, setRainRate] = useState({ value: 0, timestamp: "" });
  const [windDirection, setWindDirection] = useState({ value: "NA", timestamp: "" });
  const [windSpeed, setWindSpeed] = useState({ value: 0, timestamp: "" });
  const [dustDensity, setDustDensity] = useState({ value: 0, timestamp: "" });

  useEffect(() => {
    const fetchLoginData = async () => {
      try {
        const login = await loginTb();
        const setting = await readSetting();

        if (setting && setting.data && setting.data.length > 0) {
          const token = login.token;
          let { entityType, entityId } = setting.data[0];
          const webSocket = new WebSocket(
            process.env.NEXT_PUBLIC_TB_WS_URL || ""
          );

          webSocket.onopen = () => {
            console.log("WebSocket is open now.");
            const object = {
              authCmd: {
                cmdId: 0,
                token: token,
              },
              cmds: [
                {
                  entityType: entityType,
                  entityId: entityId,
                  scope: "LATEST_TELEMETRY",
                  cmdId: 10,
                  type: "TIMESERIES",
                },
              ],
            };
            const data = JSON.stringify(object);
            webSocket.send(data);
          };

          webSocket.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            const receivedData = JSON.parse(event.data);
            const { data } = receivedData;

            const formatTimestamp = (timestamp: any) => {
              const date = new Date(timestamp);
              return date.toLocaleString('en-US', {
                hour12: true,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
              });
            };

            const getDirection = (degree: number) => {
              const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
              const index = Math.round(degree / 45) % 8;
              return directions[index];
            };

            if (data) {
              const newTemperature = {
                value: data.temperature[0][1],
                timestamp: formatTimestamp(data.temperature[0][0]),
              };
              setTemperature(newTemperature);
              setTemperatureData(prevData => [
                ...prevData.slice(-9), // Giữ lại tối đa 10 điểm dữ liệu gần nhất
                newTemperature,
              ]);
              setHumidity({
                value: data.humidity[0][1],
                timestamp: formatTimestamp(data.humidity[0][0]),
              });
              setPressure({
                value: data.pressure[0][1],
                timestamp: formatTimestamp(data.pressure[0][0]),
              });
              setRainRate({
                value: data.rainRate[0][1],
                timestamp: formatTimestamp(data.rainRate[0][0]),
              });
              setWindDirection({
                value: getDirection(data.windDirection[0][1]),
                timestamp: formatTimestamp(data.windDirection[0][0]),
              });
              setWindSpeed({
                value: data.windSpeed[0][1],
                timestamp: formatTimestamp(data.windSpeed[0][0]),
              });
              setDustDensity({
                value: data.dustDensity[0][1],
                timestamp: formatTimestamp(data.dustDensity[0][0]),
              });
            } else {
              console.error("No data received from WebSocket.");
            }
          };

          webSocket.onclose = () => {
            console.log("WebSocket is closed now.");
          };

          webSocket.onerror = (error) => {
            console.error("WebSocket error observed:", error);
          };

          return () => {
            webSocket.close();
          };
        } else {
          console.error("Setting data is null or empty");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchLoginData();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between mx-4">
        <div className="flex flex-col">
          <div className="flex gap-3">
            <h3 className="text-2xl">Wind</h3>
            <Icons.wind className="h-8 w-8 rounded-full bg-[#0e1426] p-1" />
          </div>
          <div className="flex gap-2">
            <p className="text-xl text-[#5f6281]">Direction:</p>
            <p className="text-xl text-white">{windDirection.value}</p>
          </div>
          <div className="flex gap-2">
            <p className="text-xl text-[#5f6281]">Speed:</p>
            <p className="text-xl text-white">{windSpeed.value} m/s</p>
          </div>
        </div>
      </div>
      <div className="flex m-4 gap-3 min-h-60">
        <Swiper
          modules={[
            Navigation,
            Pagination,
            Scrollbar,
            A11y,
            Autoplay,
            Parallax,
          ]}
          spaceBetween={10}
          slidesPerView={4}
          navigation
          pagination={{ clickable: true }}
          autoplay
          breakpoints={{
            200: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 10,
            },
          }}
        >
          <SwiperSlide>
            <Card
              title="Temperature"
              icon={<Icons.temperature />}
              value={temperature.value}
              unit={"°C"}
              timestamp={temperature.timestamp}
              texts={["", "Outdoor Temperature", ""]}
            />
          </SwiperSlide>
          <SwiperSlide>
            <Card
              title="Humidity"
              icon={<Icons.droplet />}
              value={humidity.value}
              unit={"%"}
              timestamp={humidity.timestamp}
              texts={["", "Outdoor Humidity", ""]}
            />
          </SwiperSlide>
          <SwiperSlide>
            <Card
              title="Pressure"
              icon={<Icons.gauge />}
              value={pressure.value}
              unit={"hPa"}
              timestamp={pressure.timestamp}
              texts={["", "Absolute Pressure", ""]}
            />
          </SwiperSlide>
          <SwiperSlide>
            <Card
              title="Rainfall"
              icon={<Icons.cloudRain />}
              value={rainRate.value}
              unit={"mm"}
              timestamp={rainRate.timestamp}
              texts={["", "Total", ""]}
            />
          </SwiperSlide>
          <SwiperSlide>
            <Card
              title="Dust Index"
              icon={<Icons.wind />}
              value={dustDensity.value}
              unit={"µg/m³"}
              timestamp={dustDensity.timestamp}
              texts={["", "Dust in outdoor", ""]}
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
