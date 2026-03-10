from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


class AdvancedFeatureEngineering:
    
    @staticmethod
    def create_time_based_features(df: pd.DataFrame, date_column: str = 'date') -> pd.DataFrame:
        if date_column not in df.columns:
            return df
        
        df = df.copy()
        df[date_column] = pd.to_datetime(df[date_column])
        
        df['day_of_week'] = df[date_column].dt.dayofweek
        df['week_of_year'] = df[date_column].dt.isocalendar().week
        df['month'] = df[date_column].dt.month
        df['quarter'] = df[date_column].dt.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = df[date_column].dt.is_month_start.astype(int)
        df['is_month_end'] = df[date_column].dt.is_month_end.astype(int)
        
        return df
    
    @staticmethod
    def create_rolling_features(
        df: pd.DataFrame,
        value_column: str,
        group_by: Optional[List[str]] = None,
        windows: List[int] = [3, 7, 14, 30]
    ) -> pd.DataFrame:
        df = df.copy()
        
        if group_by:
            grouped = df.groupby(group_by)[value_column]
        else:
            grouped = df[value_column]
        
        for window in windows:
            df[f'{value_column}_rolling_mean_{window}'] = grouped.transform(
                lambda x: x.rolling(window, min_periods=1).mean()
            )
            df[f'{value_column}_rolling_std_{window}'] = grouped.transform(
                lambda x: x.rolling(window, min_periods=1).std()
            )
            df[f'{value_column}_rolling_max_{window}'] = grouped.transform(
                lambda x: x.rolling(window, min_periods=1).max()
            )
            df[f'{value_column}_rolling_min_{window}'] = grouped.transform(
                lambda x: x.rolling(window, min_periods=1).min()
            )
        
        return df
    
    @staticmethod
    def create_lag_features(
        df: pd.DataFrame,
        value_column: str,
        group_by: Optional[List[str]] = None,
        lags: List[int] = [1, 2, 3, 5, 10]
    ) -> pd.DataFrame:
        df = df.copy()
        
        if group_by:
            grouped = df.groupby(group_by)[value_column]
        else:
            grouped = df[value_column]
        
        for lag in lags:
            df[f'{value_column}_lag_{lag}'] = grouped.shift(lag)
        
        return df
    
    @staticmethod
    def create_trend_features(
        df: pd.DataFrame,
        value_column: str,
        group_by: Optional[List[str]] = None
    ) -> pd.DataFrame:
        df = df.copy()
        
        if group_by:
            for name, group in df.groupby(group_by):
                if len(group) > 1:
                    x = np.arange(len(group))
                    y = group[value_column].values
                    
                    valid_mask = ~np.isnan(y)
                    if np.sum(valid_mask) > 1:
                        slope = np.polyfit(x[valid_mask], y[valid_mask], 1)[0]
                        df.loc[group.index, f'{value_column}_trend_slope'] = slope
        else:
            if len(df) > 1:
                x = np.arange(len(df))
                y = df[value_column].values
                
                valid_mask = ~np.isnan(y)
                if np.sum(valid_mask) > 1:
                    slope = np.polyfit(x[valid_mask], y[valid_mask], 1)[0]
                    df[f'{value_column}_trend_slope'] = slope
        
        return df
    
    @staticmethod
    def create_performance_momentum_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        score_columns = [col for col in df.columns if 'score' in col.lower() or 'percentage' in col.lower()]
        
        for col in score_columns:
            if col in df.columns and df[col].notna().sum() > 0:
                df[f'{col}_momentum'] = df[col].diff()
                df[f'{col}_acceleration'] = df[f'{col}_momentum'].diff()
                
                df[f'{col}_above_avg'] = (df[col] > df[col].mean()).astype(int)
                df[f'{col}_percentile'] = df[col].rank(pct=True)
        
        return df
    
    @staticmethod
    def create_interaction_features(df: pd.DataFrame, feature_pairs: List[tuple]) -> pd.DataFrame:
        df = df.copy()
        
        for feat1, feat2 in feature_pairs:
            if feat1 in df.columns and feat2 in df.columns:
                df[f'{feat1}_x_{feat2}'] = df[feat1] * df[feat2]
                
                non_zero_mask = df[feat2] != 0
                df.loc[non_zero_mask, f'{feat1}_div_{feat2}'] = (
                    df.loc[non_zero_mask, feat1] / df.loc[non_zero_mask, feat2]
                )
                
                df[f'{feat1}_plus_{feat2}'] = df[feat1] + df[feat2]
        
        return df
    
    @staticmethod
    def create_subject_performance_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        subject_score_cols = [col for col in df.columns if 'subject_avg' in col.lower()]
        
        if subject_score_cols:
            df['subject_score_std'] = df[subject_score_cols].std(axis=1)
            df['subject_score_range'] = df[subject_score_cols].max(axis=1) - df[subject_score_cols].min(axis=1)
            df['subject_score_cv'] = df['subject_score_std'] / (df[subject_score_cols].mean(axis=1) + 1e-6)
            
            df['strongest_subject_score'] = df[subject_score_cols].max(axis=1)
            df['weakest_subject_score'] = df[subject_score_cols].min(axis=1)
        
        return df
    
    @staticmethod
    def create_attendance_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        if 'attendance_percentage' in df.columns:
            df['attendance_high'] = (df['attendance_percentage'] >= 90).astype(int)
            df['attendance_medium'] = (
                (df['attendance_percentage'] >= 75) & (df['attendance_percentage'] < 90)
            ).astype(int)
            df['attendance_low'] = (df['attendance_percentage'] < 75).astype(int)
            
            df['attendance_squared'] = df['attendance_percentage'] ** 2
            df['attendance_log'] = np.log1p(df['attendance_percentage'])
        
        return df
    
    @staticmethod
    def create_assignment_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        assignment_cols = [col for col in df.columns if 'assignment' in col.lower()]
        
        if 'total_assignments' in df.columns and 'completed_assignments' in df.columns:
            df['assignment_completion_rate'] = (
                df['completed_assignments'] / (df['total_assignments'] + 1e-6)
            )
            df['missing_assignments'] = df['total_assignments'] - df['completed_assignments']
        
        if 'avg_assignment_score' in df.columns:
            df['assignment_consistency'] = 1 / (df['assignment_score_std'] + 1e-6) if 'assignment_score_std' in df.columns else 0
        
        return df
    
    @staticmethod
    def create_exam_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        if 'avg_exam_score' in df.columns and 'exam_count' in df.columns:
            df['exam_performance_weight'] = df['avg_exam_score'] * np.log1p(df['exam_count'])
        
        if 'exam_trend_slope' in df.columns:
            df['improving_trend'] = (df['exam_trend_slope'] > 0).astype(int)
            df['declining_trend'] = (df['exam_trend_slope'] < 0).astype(int)
        
        return df
    
    @staticmethod
    def create_composite_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        performance_cols = []
        if 'attendance_percentage' in df.columns:
            performance_cols.append('attendance_percentage')
        if 'avg_assignment_score' in df.columns:
            performance_cols.append('avg_assignment_score')
        if 'avg_exam_score' in df.columns:
            performance_cols.append('avg_exam_score')
        
        if len(performance_cols) >= 2:
            df['overall_performance_score'] = df[performance_cols].mean(axis=1)
            df['performance_consistency'] = 1 / (df[performance_cols].std(axis=1) + 1e-6)
        
        if 'attendance_percentage' in df.columns and 'avg_assignment_score' in df.columns:
            df['engagement_score'] = (df['attendance_percentage'] * 0.4 + df['avg_assignment_score'] * 0.6)
        
        return df
    
    @staticmethod
    def apply_all_advanced_features(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        df = AdvancedFeatureEngineering.create_attendance_features(df)
        df = AdvancedFeatureEngineering.create_assignment_features(df)
        df = AdvancedFeatureEngineering.create_exam_features(df)
        df = AdvancedFeatureEngineering.create_subject_performance_features(df)
        df = AdvancedFeatureEngineering.create_composite_features(df)
        df = AdvancedFeatureEngineering.create_performance_momentum_features(df)
        
        common_interactions = [
            ('attendance_percentage', 'avg_assignment_score'),
            ('attendance_percentage', 'avg_exam_score'),
            ('avg_assignment_score', 'avg_exam_score'),
        ]
        
        existing_pairs = [
            (f1, f2) for f1, f2 in common_interactions
            if f1 in df.columns and f2 in df.columns
        ]
        
        if existing_pairs:
            df = AdvancedFeatureEngineering.create_interaction_features(df, existing_pairs)
        
        df = df.fillna(0)
        
        return df
