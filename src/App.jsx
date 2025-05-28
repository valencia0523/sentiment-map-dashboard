import { useLayoutEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export default function App() {
  useLayoutEffect(() => {
    const root = am5.Root.new("chartdiv");

    fetch("/geo_sentiments.csv")
      .then((res) => res.text())
      .then((text) => {
        const continents = {
          AF: 0,
          AN: 1,
          AS: 2,
          EU: 3,
          NA: 4,
          OC: 5,
          SA: 6,
        };

        const rows = text.trim().split("\n").slice(1);
        const countries = new Set();

        rows.forEach((row) => {
          const [country] = row.split(",");
          countries.add(country.trim());
        });

        const result = {};
        countries.forEach((country) => {
          const isoCode = getCountryCode(country);
          const continent = getContinentCode(isoCode);
          const map = getMapName(isoCode);
          if (isoCode && continent && map) {
            result[isoCode] = {
              continent_code: continent,
              maps: [map],
            };
          }
        });

        const am5geodata_data_countries2 = result;

        const colors = am5.ColorSet.new(root, {});
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
          am5map.MapChart.new(root, {
            panX: "rotateX",
            projection: am5map.geoMercator(),
          })
        );

        const worldSeries = chart.series.push(
          am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_worldLow,
            exclude: ["AQ"],
          })
        );

        worldSeries.mapPolygons.template.setAll({
          tooltipText: "{name}",
          interactive: true,
          fill: am5.color(0xaaaaaa),
          templateField: "polygonSettings",
        });

        worldSeries.mapPolygons.template.states.create("hover", {
          fill: colors.getIndex(9),
        });

        const countrySeries = chart.series.push(
          am5map.MapPolygonSeries.new(root, {
            visible: false,
          })
        );

        countrySeries.mapPolygons.template.setAll({
          tooltipText: "{name}",
          interactive: true,
          fill: am5.color(0xaaaaaa),
        });

        countrySeries.mapPolygons.template.states.create("hover", {
          fill: colors.getIndex(9),
        });

        const data = [];
        for (let id in am5geodata_data_countries2) {
          const country = am5geodata_data_countries2[id];
          if (country.maps.length) {
            data.push({
              id: id,
              map: country.maps[0],
              polygonSettings: {
                fill: colors.getIndex(continents[country.continent_code]),
              },
            });
          }
        }

        worldSeries.data.setAll(data);

        let currentDataItem;

        worldSeries.mapPolygons.template.events.on("click", (ev) => {
          const dataItem = ev.target.dataItem;
          const data = dataItem.dataContext;
          const zoomAnimation = worldSeries.zoomToDataItem(dataItem);
          currentDataItem = dataItem;

          Promise.all([
            zoomAnimation.waitForStop(),
            am5.net.load(
              `https://cdn.amcharts.com/lib/5/geodata/json/${data.map}.json`,
              chart
            ),
          ]).then((results) => {
            const geodata = am5.JSONParser.parse(results[1].response);
            countrySeries.setAll({
              geoJSON: geodata,
              fill: data.polygonSettings.fill,
            });

            countrySeries.show();
            worldSeries.hide(100);
            backContainer.show();
            chart.set("minZoomLevel", chart.get("zoomLevel"));
          });
        });

        const backContainer = chart.children.push(
          am5.Container.new(root, {
            x: am5.p100,
            centerX: am5.p100,
            dx: -10,
            y: 30,
            paddingTop: 5,
            paddingRight: 10,
            paddingBottom: 5,
            interactiveChildren: false,
            layout: root.horizontalLayout,
            cursorOverStyle: "pointer",
            background: am5.RoundedRectangle.new(root, {
              fill: am5.color(0xffffff),
              fillOpacity: 0.2,
            }),
            visible: false,
          })
        );

        backContainer.children.push(
          am5.Label.new(root, {
            text: "Back to world map",
            centerY: am5.p50,
          })
        );

        backContainer.events.on("click", function () {
          chart.set("minZoomLevel", 1);
          chart.goHome();
          worldSeries.show();
          countrySeries.hide();
          backContainer.hide();
          currentDataItem = undefined;
        });

        const zoomControl = chart.set(
          "zoomControl",
          am5map.ZoomControl.new(root, {})
        );

        const homeButton = zoomControl.children.moveValue(
          am5.Button.new(root, {
            paddingTop: 10,
            paddingBottom: 10,
            icon: am5.Graphics.new(root, {
              svgPath:
                "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8",
              fill: am5.color(0xffffff),
            }),
          }),
          0
        );

        homeButton.events.on("click", function () {
          if (currentDataItem) {
            countrySeries.zoomToDataItem(currentDataItem);
          } else {
            chart.goHome();
          }
        });
      });

    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-4">World Map</div>
      <div id="chartdiv" style={{ width: "100%", height: "600px" }} />
    </div>
  );
}

function getCountryCode(countryName) {
  const mapping = {
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
    Australia: "AU",
    Germany: "DE",
    France: "FR",
    Japan: "JP",
    China: "CN",
    India: "IN",
    Brazil: "BR",
    Mexico: "MX",
    Russia: "RU",
    Italy: "IT",
    Spain: "ES",
    "South Korea": "KR",
    Netherlands: "NL",
    "Saudi Arabia": "SA",
    "South Africa": "ZA",
    Turkey: "TR",
  };
  return mapping[countryName] || null;
}

function getContinentCode(isoCode) {
  const continentMapping = {
    US: "NA",
    GB: "EU",
    CA: "NA",
    AU: "OC",
    DE: "EU",
    FR: "EU",
    JP: "AS",
    CN: "AS",
    IN: "AS",
    BR: "SA",
    MX: "NA",
    RU: "EU",
    IT: "EU",
    ES: "EU",
    KR: "AS",
    NL: "EU",
    SA: "AS",
    ZA: "AF",
    TR: "AS",
  };
  return continentMapping[isoCode] || null;
}

function getMapName(isoCode) {
  const mapMapping = {
    US: "usaLow",
    GB: "ukLow",
    CA: "canadaLow",
    AU: "australiaLow",
    DE: "germanyLow",
    FR: "franceLow",
    JP: "japanLow",
    CN: "chinaLow",
    IN: "indiaLow",
    BR: "brazilLow",
    MX: "mexicoLow",
    RU: "russiaLow",
    IT: "italyLow",
    ES: "spainLow",
    KR: "southKoreaLow",
    NL: "netherlandsLow",
    SA: "saudiArabiaLow",
    ZA: "southAfricaLow",
    TR: "turkeyLow",
  };
  return mapMapping[isoCode] || null;
}
