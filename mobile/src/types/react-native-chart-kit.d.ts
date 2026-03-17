declare module 'react-native-chart-kit' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    backgroundGradientFromOpacity?: number;
    backgroundGradientToOpacity?: number;
    decimalPlaces?: number;
    color?: (opacity: number) => string;
    labelColor?: (opacity: number) => string;
    style?: ViewStyle;
    propsForDots?: any;
    propsForLabels?: any;
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
    fillShadowGradient?: string;
    fillShadowGradientOpacity?: number;
  }

  export interface Dataset {
    data: number[];
    color?: (opacity: number) => string;
    colors?: ((opacity: number) => string)[];
    strokeWidth?: number;
    withDots?: boolean;
  }

  export interface ChartData {
    labels: string[];
    datasets: Dataset[];
    legend?: string[];
  }

  export interface AbstractChartProps {
    data: ChartData;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: ViewStyle;
  }

  export class LineChart extends Component<
    AbstractChartProps & {
      bezier?: boolean;
      withDots?: boolean;
      withInnerLines?: boolean;
      withOuterLines?: boolean;
      withVerticalLines?: boolean;
      withHorizontalLines?: boolean;
      withVerticalLabels?: boolean;
      withHorizontalLabels?: boolean;
      withShadow?: boolean;
      yAxisLabel?: string;
      yAxisSuffix?: string;
      yAxisInterval?: number;
      xAxisLabel?: string;
      segments?: number;
      transparent?: boolean;
      onDataPointClick?: (data: any) => void;
      decorator?: () => void;
      getDotColor?: (dataPoint: any, index: number) => string;
      renderDotContent?: (data: any) => React.ReactNode;
    }
  > {}

  export class BarChart extends Component<
    AbstractChartProps & {
      withInnerLines?: boolean;
      withVerticalLabels?: boolean;
      withHorizontalLabels?: boolean;
      fromZero?: boolean;
      yAxisLabel?: string;
      yAxisSuffix?: string;
      segments?: number;
      showValuesOnTopOfBars?: boolean;
      showBarTops?: boolean;
      withCustomBarColorFromData?: boolean;
      flatColor?: boolean;
    }
  > {}

  export class PieChart extends Component<
    Omit<AbstractChartProps, 'data'> & {
      data: {
        name: string;
        population: number;
        color: string;
        legendFontColor?: string;
        legendFontSize?: number;
      }[];
      accessor?: string;
      backgroundColor?: string;
      paddingLeft?: string;
      center?: number[];
      absolute?: boolean;
      hasLegend?: boolean;
      avoidFalseZero?: boolean;
    }
  > {}

  export class ProgressChart extends Component<
    Omit<AbstractChartProps, 'data'> & {
      data: {
        labels?: string[];
        data: number[];
        colors?: string[];
      };
      strokeWidth?: number;
      radius?: number;
      hideLegend?: boolean;
    }
  > {}

  export class ContributionGraph extends Component<
    Omit<AbstractChartProps, 'data'> & {
      values: { date: string; count: number }[];
      endDate: Date;
      numDays: number;
      gutterSize?: number;
      squareSize?: number;
      horizontal?: boolean;
      showMonthLabels?: boolean;
      showOutOfRangeDays?: boolean;
      tooltipDataAttrs?: (value: any) => any;
      onDayPress?: (value: any) => void;
    }
  > {}

  export class StackedBarChart extends Component<
    AbstractChartProps & {
      barPercentage?: number;
      hideLegend?: boolean;
      decimalPlaces?: number;
    }
  > {}
}
