const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
  container: "map",
  style: "reinfolib.json",
  center: [139.47507, 35.90596],
  zoom: 12,
  minZoom: 11,
  maxPitch: 85,
  pitch: 0,
  bearing: 0,
  hash: true,
  attributionControl: false,
});

//ジオコーダー（国土地理院 地名検索API）
var geocoder_api = {
  forwardGeocode: async (config) => {
    const features = [];
    const Text_Prefix = config.query.substr(0, 3);
    try {
      let request =
        "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" +
        config.query;
      const response = await fetch(request);
      const geojson = await response.json();

      for (var i = 0; i < geojson.length; i++) {
        if (geojson[i].properties.title.indexOf(Text_Prefix) !== -1) {
          let point = {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: geojson[i].geometry.coordinates,
            },
            place_name: geojson[i].properties.title,
            properties: geojson[i].properties,
            text: geojson[i].properties.title,
            place_type: ["place"],
            center: geojson[i].geometry.coordinates,
          };
          features.push(point);
        }
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }
    return {
      features: features,
    };
  },
};
map.addControl(
  new MaplibreGeocoder(geocoder_api, { maplibregl: maplibregl }),
  "top-right"
);

map.addControl(new maplibregl.NavigationControl());
map.addControl(new maplibregl.FullscreenControl());
map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: false },
    fitBoundsOptions: { maxZoom: 18 },
    trackUserLocation: true,
    showUserLocation: true,
  })
);
map.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: "metric" }));
map.addControl(
  new maplibregl.AttributionControl({
    compact: true,
    customAttribution:
      '（<a href="https://twitter.com/shi__works" target="_blank">X(旧Twitter)</a> | ' +
      '<a href="https://github.com/shiwaku/mlit-reinfolib-map-on-maplibre" target="_blank">GitHub</a>）',
  })
);


const layerIds = [
  "XPT001",
  "XPT001-symbol",
  "XPT002",
  "XPT002-symbol",
  "XKT001",
  "XKT002",
  "XKT003",
  "XKT003-line",
  "XKT004",
  "XKT004-line",
  "XKT005",
  "XKT005-line",
  "XKT006",
  "XKT007",
  "XKT010",
  "XKT011",
  "XKT013",
  "XKT014",
  "XKT014-line",
  "XKT015",
  "XKT016",
  "XKT016-line",
  "XKT017",
  "XKT018",
  "XKT019",
  "XKT019-line",
  "XKT020",
  "XKT020-line",
  "XKT021",
  "XKT021-line",
  "XKT022",
  "XKT022-line",
  "XKT023",
  "XKT023-line",
  "XKT024",
  "XKT024-line",
  "XKT025",
  "XKT025-line",
];

map.on("load", () => {
  map.showTileBoundaries = true;
  setupLayerSwitches();
  layerIds.forEach(addPopupHandler);
});

/**
 * チェックボックスの状態に応じてレイヤー表示を切り替え
 */
/*
function setupLayerSwitches() {
  document.querySelectorAll(".layer-switch").forEach((input) => {
    input.addEventListener("change", () => {
      const layer = input.dataset.layer;
      map.setLayoutProperty(
        layer,
        "visibility",
        input.checked ? "visible" : "none"
      );
    });
  });
}
*/

function setupLayerSwitches() {
  document.querySelectorAll(".layer-switch").forEach((input) => {
    input.addEventListener("change", () => {
      input.dataset.layer
        .split(",")
        .map((id) => id.trim())
        .forEach((layer) => {
          map.setLayoutProperty(
            layer,
            "visibility",
            input.checked ? "visible" : "none"
          );
        });
    });
  });
}

/**
 * 各レイヤーにポップアップのクリックハンドラを登録
 */
/*
function addPopupHandler(layerId) {
  map.on("click", layerId, (e) => {
    // ポリゴン はクリック位置を e.lngLat から取得
    const useLngLat =
      layerId === "XKT001" ||
      layerId === "XKT002" ||
      layerId === "XKT003" ||
      layerId === "XKT004" ||
      layerId === "XKT005" ||
      layerId === "XKT013" ||
      layerId === "XKT014" ||
      layerId === "XKT016";
    const coords = useLngLat
      ? [e.lngLat.lng, e.lngLat.lat]
      : e.features[0].geometry.coordinates.slice();
    const props = e.features[0].properties;
    createPopup(coords, props);
  });
}
*/

/*
function addPopupHandler(layerId) {
  map.on("click", layerId, (e) => {
    const feature = e.features[0];
    const coords = [e.lngLat.lng, e.lngLat.lat];  // ← これだけで OK
    createPopup(coords, feature.properties);
  });
}
*/

function addPopupHandler(layerId) {
  map.on("click", layerId, (e) => {
    // クリック位置に描画されている同一レイヤーの全フィーチャを取得
    const features = map.queryRenderedFeatures(e.point, {
      layers: [layerId]
    });
    if (!features.length) return;

    // ポップアップ設置位置
    const coords = [e.lngLat.lng, e.lngLat.lat];
    // コンテナ要素
    const container = document.createElement("div");

    features.forEach((feature, idx) => {
      // 各フィーチャの見出し（レイヤー名＋番号）
      const title = document.createElement("h4");
      title.textContent = `${layerId} (${idx + 1})`;
      title.style.margin = "4px 0 2px";
      title.style.fontSize = "90%";
      container.appendChild(title);

      // 属性テーブル
      const table = document.createElement("table");
      table.className = "popup-table";
      table.innerHTML =
        "<tr><th>属性</th><th>値</th></tr>" +
        Object.entries(feature.properties)
          .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
          .join("");
      container.appendChild(table);
    });

    // ポップアップ表示
    new maplibregl.Popup({ maxWidth: "300px" })
      .setLngLat(coords)
      .setDOMContent(container)
      .addTo(map);
  });
}

/*
// プロパティからテーブルを生成し、Popup を表示
function createPopup(coordinates, properties) {
  const table = document.createElement("table");
  table.className = "popup-table";
  table.innerHTML =
    "<tr><th>属性</th><th>値</th></tr>" +
    Object.entries(properties)
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");

  new maplibregl.Popup({ maxWidth: "300px" })
    .setLngLat(coordinates)
    .setDOMContent(table)
    .addTo(map);
}
*/
