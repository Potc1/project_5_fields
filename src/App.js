import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './App.css';

// ⚠️ ЗАМЕНИТЕ НА ВАШ ТОКЕН!
const MAPBOX_TOKEN = 'pk.eyJ1IjoicG90YyIsImEiOiJjbWpqamc5ZXgxbXR1M2ZxeGFoajMwZzdrIn0.IdS9kJBrzb6AEiiJC8AdXg';

function App() {
  const mapContainerRef = useRef();
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygons, setDrawnPolygons] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const USERNAME = 'potc'
  const DATASET_ID = 'cmjjkll9d24o31nmohylbw3a5'
  const DATASET_TOKEN = 'sk.eyJ1IjoicG90YyIsImEiOiJjbWpqd2JlaDQyM2ZrM2RzNnUybnVqN29oIn0.d8kiV-866FKx9UMuXZTeiQ'
  const mbxDataSetClient = require('@mapbox/mapbox-sdk/services/datasets'); // вот эти 
  const datasetClient = mbxDataSetClient({ accessToken: DATASET_TOKEN }) 
  const [inpName, setInp] = useState('')
  const [inpArea, setArea] = useState('')


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
        data: 'http://localhost:3200/1/file.geojson'
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
          .setHTML(e.features[0].properties.name)
          .addTo(mapRef.current);
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
    mapRef.current.on('draw.create', (e) => {
      console.log('🟢 Полигон создан:', e.features);
      // Можно сразу сохранять в dataset
    });
    
    mapRef.current.on('draw.delete', (e) => {
      console.log('🔴 Фигура удалена');
    });


  
  

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
      features.features[features.features.length - 1].properties = {"name": inpName, "area": inpArea}
      console.log(`Данные для экспорта ${JSON.stringify(features.features[features.features.length - 1])}`)
      console.log(features.features[features.features.length - 1])
      fetch(`http://localhost:3200/1/create`,{
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

  return (
    <div className="app-container">
      {/* Панель управления */}
      <div className="controls-panel">
        <h3>Mapbox Drawing Tool</h3>
        
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
        <input className='control-btn' onChange={(e)=>{setInp(e.target.value); }} placeholder='name'/>
        <input className='control-btn' onChange={(e)=>{setArea(e.target.value); }} placeholder='area'/>
        <div className="info">
          <p><strong>Инструкция:</strong></p>
          <p>1. Нажмите "Начать рисовать"</p>
          <p>2. Кликайте на карте для создания вершин</p>
          <p>3. Для завершения: клик на первую точку или двойной клик</p>
        </div>
      </div>

      {/* Контейнер карты */}
      <div 
        ref={mapContainerRef} 
        className="map-container"
      />
    </div>
  );
}

export default App;