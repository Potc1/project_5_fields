import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import ReactJsonView from '@microlink/react-json-view'
import ReactDOM from 'react-dom';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicG90YyIsImEiOiJjbWpqamc5ZXgxbXR1M2ZxeGFoajMwZzdrIn0.IdS9kJBrzb6AEiiJC8AdXg';
let season_data = '';

async function MoveSidePanel(first_param, second_param){
  season_data = await fetch(`http://localhost:3200/${first_param}/${second_param}/data`).then(res => res.json())
  console.log('Another function')
  console.log(season_data)
  return (
    Object.entries(season_data).map(([key, value]) => {
      <input className='control-btn export-btn' onChange={(e)=>{}} placeholder={key}/>
      if ('Proccessings' in value){
        for(const k in value['Proccessings']){
          console.log(value['Proccessings'][k])

        }
      }
    })
  )
}

function useScript(url) {
  useEffect(() => {
    const script = document.createElement('script');
    //script.src = url;
    //script.async = false;
    script.textContent = `
    function displayData(data, first_param, second_param){
      console.log(data)
      fetch('http://localhost:3200/' + first_param + '/' + second_param +'/delete' ,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({'id': data})
      });
    }
    `
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
}


function App() {
  const params = new URLSearchParams(window.location.search);
  const first_param = params.get('id')
  const second_param = params.get('remote')
  console.log(`params: ${first_param} and ${second_param}`);

  const mapContainerRef = useRef();
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygons, setDrawnPolygons] = useState([]);
  const [inpName, setInp] = useState('')
  const [inpArea, setArea] = useState('')
  const [roundedArea, setRoundedArea] = useState();
  const [promiseConfig, setPromiseConfig] = useState();
  const [configBase, setBaseConfig] = useState();
  const [show, setShow] = useState(false);
  const [deletedId, setDeletedId] = useState('')

  const RequestOptions = {
        method: 'GET',
        headers: {'Content-Type': 'application/json' },
    };

  useScript(`C:/Users/Admin/ЧТО/ФМИАТ/3 курс/Проект5/mapbox-drawing-app/src/script.js`)
  useEffect(() => {
      fetch(`http://localhost:3200/${first_param}/${second_param}/data`, RequestOptions)
      .then(response => {
        setPromiseConfig(response.json());
      })
      .then(data => {
        console.log((data))
      })
  }, []);

  useEffect(() => {
    
    // 2. Инициализируем карту (только если есть токен)
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes(' ')) {
      console.error('⚠️ Добавьте ваш Mapbox токен!');
      return;
    }
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/potc/cmjjk0fns003901s77vkbht7y',
      center: [48.367267, 54.30458],
      zoom: 10.12
    });
    

    mapRef.current.on('load', () => {
      mapRef.current.addSource('states', {
        type: 'geojson',
        data: `http://localhost:3200/${first_param}/${second_param}/file.geojson`
      });

      mapRef.current.addLayer({
        id: 'states-layer',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': 'rgba(200, 100, 240, 0.4)',
          'fill-outline-color': 'rgba(200, 100, 240, 1)'
        }
      });

      mapRef.current.on('click', 'states-layer', (e) => {

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<b>name:</b> ${e.features[0].properties.name}<br>
                    <b>area:</b> ${e.features[0].properties.area}
                    <button class="control-btn stop-btn" onclick="displayData('${e.features[0].properties.id}', '${first_param}', '${second_param}')">Удалить</button>`)
          .addTo(mapRef.current);
          console.log(e.features)
      });

      mapRef.current.on('mouseenter', 'states-layer', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });

      mapRef.current.on('mouseleave', 'states-layer', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });
    });


    // 4. Добавляем остальные контролы и обработчики
    mapRef.current.addControl(new mapboxgl.NavigationControl());
    
    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
        line_string: false,
        point: false
      }
    });
    
    mapRef.current.addControl(drawRef.current);
    
    // Обработчики рисования
    mapRef.current.on('draw.create', updateArea, (e) => {
      console.log('🟢 Полигон создан:', e.features);
      // Можно сразу сохранять в dataset
    });
    
    mapRef.current.on('draw.delete', updateArea, (e) => {
      console.log('🔴 Фигура удалена');
    });
    mapRef.current.on('draw.update', updateArea);

    function updateArea(e) {
      const data = drawRef.current.getAll();
      if (data.features.length > 0) {
        const area = turf.area(data);
        setRoundedArea(Math.round(area * 100) / 100);
        data.features[0].properties = {"area": Math.round(area * 100) / 100}
        console.log(data.features[0], Math.round(area * 100) / 100)
      } else {
        setRoundedArea();
        if (e.type !== 'draw.delete') alert('Click the map to draw a polygon.');
      }
    }
    


  return () => mapRef.current.remove();
    
  
  }, []); // Пустой массив зависимостей - запускается один раз


  // Начать рисование полигона
  const startDrawingPolygon = () => {
    if (drawRef.current) {
      drawRef.current.changeMode('draw_polygon');
      setIsDrawing(true);
      console.log('🎨 Режим рисования активирован');
    }
  };

  // Завершить рисование
  const stopDrawing = () => {
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select');
      setIsDrawing(false);
      console.log('⏹️ Режим рисования завершен');
    }
  };

  // Показать все фигуры в консоли
  const showAllFeatures = () => {
    if (drawRef.current) {
      const features = drawRef.current.getAll();
      console.log('📋 Все фигуры:', features);
      alert(`Всего фигур: ${features.features.length}`);
    }
  };

  // Удалить все фигуры
  const clearAllFeatures = () => {
    if (drawRef.current && window.confirm('Удалить все фигуры?')) {
      const features = drawRef.current.getAll();
      features.features.forEach(feature => {
        drawRef.current.delete(feature.id);
      });
      setDrawnPolygons([]);
      console.log('🧹 Все фигуры удалены');
      promiseConfig.then(
        data => {setBaseConfig(data)},
        err => {console.log(err);}
      )
      console.log(configBase)
    }
  };
  
  // Экспорт фигур в GeoJSON
  const exportToGeoJSON = async () => {
    if (drawRef.current) {
      const features = drawRef.current.getAll();
      const geoJson = {
        type: 'FeatureCollection',
        features: features.features
      };
      const user_properities = features.features[features.features.length - 1].properties
      console.log(`Данные при рисовании ${user_properities}`)
      if (inpArea != ""){
        features.features[features.features.length - 1].properties = {"name": inpName, "area": inpArea, "id": features.features[features.features.length - 1].id}
      }
      else {
        features.features[features.features.length - 1].properties = {"name": inpName, "area": roundedArea, "id": features.features[features.features.length - 1].id} 
      }
      console.log(`Данные для экспорта ${JSON.stringify(features.features[features.features.length - 1])}`)
      console.log(features.features[features.features.length - 1])
      fetch(`http://localhost:3200/${first_param}/${second_param}/create`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(features.features[features.features.length - 1])
      });
      const dataStr = JSON.stringify(geoJson, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'map_polygons.geojson';
      const linkElement = document.createElement('a');
      linkElement.click();
      console.log('💾 GeoJSON экспортирован');
    }
  };

  const handleClose = () => {setShow(false); }
  const handleShow = () => {setShow(true); MoveSidePanel(first_param, second_param)};

  return (
    <div className="app-container">
      {/* Панель управления */}
      <div className="controls-panel">
        <h3><Button variant="primary" onClick={handleShow}>
          Mapbox Drawing Tool
          </Button></h3>
        
        <button 
          className={`control-btn ${isDrawing ? 'active' : ''}`}
          onClick={startDrawingPolygon}
          disabled={isDrawing}
        >
          {isDrawing ? '🎨 Рисуем...' : '✏️ Начать рисовать'}
        </button>
        
        {isDrawing && (
          <button className="control-btn stop-btn" onClick={stopDrawing}>
            ⏹️ Завершить
          </button>
        )}
        
        <button className="control-btn" onClick={showAllFeatures}>
          📋 Показать фигуры ({drawnPolygons.length})
        </button>
        
        <button className="control-btn export-btn" onClick={exportToGeoJSON}>
          💾 Экспорт GeoJSON
        </button>
        
        <button className="control-btn clear-btn" onClick={clearAllFeatures}>
          🧹 Очистить всё
        </button>
        <input className='control-btn export-btn' onChange={(e)=>{setInp(e.target.value); }} placeholder='name'/>
        <input className='control-btn export-btn' onChange={(e)=>{setArea(e.target.value); }} placeholder='area'/>
        <div className="info">
          <p><strong>Инструкция:</strong></p>
          <p>1. Нажмите "Начать рисовать"</p>
          <p>2. Кликайте на карте для создания вершин</p>
          <p>3. Для завершения: клик на первую точку или двойной клик</p>
        </div>
      </div>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Сезоны</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ReactJsonView src={configBase} theme="monokai" />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Контейнер карты */}
      <div 
        ref={mapContainerRef} 
        className="map-container"
      />
    </div>
  );
}

export default App;