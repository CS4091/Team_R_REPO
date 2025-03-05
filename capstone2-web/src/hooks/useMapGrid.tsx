import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Box } from "@mui/material";

const gridSize = 100;
const defaultColor: [number, number, number] = [0, 0, 0];

type MapGridContextType = {
    clearMap: () => void;
    setMap: (data: number[][][]) => void;
    SVGMap: React.FC;
};

const MapGridContext = createContext<MapGridContextType | null>(null);

type MapGridProviderProps = {
    children: ReactNode;
};

export const MapGridProvider: React.FC<MapGridProviderProps> = ({ children }) => {
    const [mapData, setMapData] = useState<number[][][]>(
        Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => [Math.random() * 255, Math.random() * 255, Math.random() * 255]))    
    );
    const [cellWidth, setCellWidth] = useState<number>(5);
    const [cellHeight, setCellHeight] = useState<number>(5);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const updateCellSize = () => {
            console.log("updateCellSize");
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setCellWidth(width / gridSize);
                setCellHeight(height / gridSize);
            }
        };
        
        updateCellSize();
        window.addEventListener('resize', updateCellSize);
        return () => window.removeEventListener('resize', updateCellSize);
    }, []);

    const clearMap = useCallback(() => {
        setMapData(
            Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => [...defaultColor]))
        );
    }, []);

    const setMap = useCallback((data: number[][][]) => {
        if (
            Array.isArray(data) &&
            data.length === gridSize &&
            data.every(row => Array.isArray(row) && row.length === gridSize &&
                row.every(cell => Array.isArray(cell) && cell.length === 3 && cell.every(value => typeof value === 'number')))
        ) {
            setMapData(data);
        } else {
            console.error("Invalid map data format. Ensure it's a 100x100 array with [R, G, B] values.");
        }
    }, []);

    const SVGMap: React.FC = () => (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: 'calc(100vh - 95px)',
                pointerEvents: 'none'
            }}
        >
            <svg viewBox={`0 0 ${gridSize * cellWidth} ${gridSize * cellHeight}`}>
                {mapData.map((row, y) =>
                    row.map((color, x) => (
                        <rect
                            key={`${x}-${y}`}
                            x={x * cellWidth}
                            y={y * cellHeight}
                            width={cellWidth}
                            height={cellHeight}
                            fill={`rgb(${color[0]},${color[1]},${color[2]})`}
                            fillOpacity={0.7}
                        />
                    ))
                )}
            </svg>
        </Box>
    );

    return (
        <MapGridContext.Provider value={{ clearMap, setMap, SVGMap }}>
            {children}
        </MapGridContext.Provider>
    );
};

export const useMapGrid = (): MapGridContextType => {
    const context = useContext(MapGridContext);
    if (!context) {
        throw new Error("useMapGrid must be used within a MapGridProvider");
    }
    return context;
};
