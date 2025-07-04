import { Box, Paper, Typography } from "@mui/material";
import { WarningOutlined } from "@mui/icons-material";
import dayjs from "dayjs";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { dummyDataPointsList } from "~/__fixtures__/dummy-insight";
import { grey } from "@mui/material/colors";
import { InsightDataPoint, InsightResolution } from "~~/model/insight_pb";
const placeholderData = [{ name: "All", points: dummyDataPointsList }];

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  LegendComponent,
]);

const labelFormatter = (
  time: number | string,
  resolution: InsightResolution
): string => {
  if (resolution === InsightResolution.MONTHLY) {
    return dayjs(time).format("YYYY/MM");
  }
  return dayjs(time).format("YYYY/MM/DD");
};

const NO_DATA_TEXT = "No data is available.";

export interface ChartBaseProps {
  title: string;
  xName: string;
  yName: string;
  yMax?: number;
  resolution: InsightResolution;
  data: { name: string; points: InsightDataPoint.AsObject[] }[];
  lineColor: string;
  areaColor: string;
}

const tooltip = {
  trigger: "axis",
};

export const ChartBase: FC<ChartBaseProps> = ({
  title,
  xName,
  yName,
  yMax,
  resolution,
  data,
  lineColor,
  areaColor,
}) => {
  const [chart, setChart] = useState<echarts.ECharts | null>(null);
  const chartElm = useRef<HTMLDivElement | null>(null);
  const isNoData = data.length === 0;
  const _data = isNoData ? placeholderData : data;

  useEffect(() => {
    if (chart && _data.length !== 0) {
      chart.setOption({
        legend: { data: _data.map((v) => v.name) },
        xAxis: {
          type: "category",
          name: xName,
          nameLocation: "center",
          nameGap: 32,
          data: _data[0].points.map((v) =>
            labelFormatter(v.timestamp, resolution)
          ),
        },
        yAxis: {
          type: "value",
          name: yName,
          nameLocation: "center",
          nameGap: 50,
          max: yMax,
        },
        tooltip,
        series: _data.map((v) => ({
          name: v.name,
          type: "bar",
          stack: title,
          data: v.points.map((point) => point.value),
          emphasis: {
            focus: "series",
          },
          itemStyle: {
            color: isNoData ? grey[300] : lineColor,
          },
          lineStyle: {
            color: isNoData ? grey[300] : lineColor,
          },
          areaStyle: {
            color: isNoData ? grey[300] : areaColor,
          },
        })),
      });
    }
  }, [
    chart,
    _data,
    resolution,
    lineColor,
    areaColor,
    xName,
    yName,
    yMax,
    title,
    isNoData,
  ]);

  useEffect(() => {
    if (chartElm.current) {
      setChart(echarts.init(chartElm.current));
    }
  }, [chartElm]);

  const handleResize = useCallback(() => {
    if (chart) {
      chart.resize();
    }
  }, [chart]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return (
    <Paper elevation={1} sx={{ minWidth: 600, position: "relative" }}>
      <Typography
        variant="h6"
        component="div"
        sx={{
          padding: 3,
          pb: 0,
        }}
      >
        {title}
      </Typography>
      <div style={{ width: "100%", height: 400 }} ref={chartElm} />
      {data.length === 0 ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: 0,
            left: 0,
            bgcolor: "#fafafabb",
          }}
        >
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ display: "flex" }}
          >
            <WarningOutlined sx={{ mr: 1 }} />
            {NO_DATA_TEXT}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );
};
