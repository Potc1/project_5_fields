import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

function App() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoicG90YyIsImEiOiJjbWpqamc5ZXgxbXR1M2ZxeGFoajMwZzdrIn0.IdS9kJBrzb6AEiiJC8AdXg';
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/potc/cmjjk0fns003901s77vkbht7y',
      center: [-74.0242, 40.6941],
      zoom: 10.12
    });

    // Инициализация инструмента рисования
    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      }
    });

    mapRef.current.addControl(drawRef.current);

    // Обработчик завершения рисования
    mapRef.current.on('draw.create', (e) => {
      console.log('Полигон создан:', e.features);
      // Здесь можно сохранить фигуру в состояние или отправить на сервер
    });

    mapRef.current.on('draw.delete', (e) => {
      console.log('Фигура удалена:', e.features);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Функция для начала рисования полигона
  const startDrawingPolygon = () => {
    if (drawRef.current) {
      drawRef.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
  };

  // Функция для завершения рисования
  const stopDrawing = () => {
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select');
      setIsDrawing(false);
    }
  };

  // Получение всех нарисованных фигур
  const getAllFeatures = () => {
    if (drawRef.current) {
      const features = drawRef.current.getAll();
      console.log('Все фигуры:', features);
      return features;
    }
    return null;
  };

  return (
    <>
      <div className="controls">
        <button 
          className="draw-button" 
          onClick={startDrawingPolygon}
          disabled={isDrawing}
        >
          {isDrawing ? 'Рисуем...' : 'Начать рисовать полигон'}
        </button>
        
        {isDrawing && (
          <button className="stop-button" onClick={stopDrawing}>
            Завершить рисование
          </button>
        )}
        
        <button className="get-features-button" onClick={getAllFeatures}>
          Показать все фигуры
        </button>
      </div>
      
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
    </>
  );
}

export default App;