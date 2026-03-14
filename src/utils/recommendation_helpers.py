"""
Helper utilities for the recommendation engine.
Provides common functions for scoring, ranking, and filtering recommendations.
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import math


def normalize_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Normalize a score to a 0-1 range"""
    if score < min_val:
        return 0.0
    if score > max_val:
        return 1.0
    return (score - min_val) / (max_val - min_val) if max_val != min_val else 0.5


def weighted_average(scores: List[Tuple[float, float]]) -> float:
    """
    Calculate weighted average from list of (value, weight) tuples.
    Args:
        scores: List of (value, weight) tuples
    Returns:
        Weighted average score
    """
    if not scores:
        return 0.0
    
    total_weight = sum(weight for _, weight in scores)
    if total_weight == 0:
        return 0.0
    
    weighted_sum = sum(value * weight for value, weight in scores)
    return weighted_sum / total_weight


def calculate_decay_factor(days_ago: int, half_life_days: int = 30) -> float:
    """
    Calculate exponential decay factor for time-based relevance.
    More recent items get higher scores.
    
    Args:
        days_ago: Number of days since the event
        half_life_days: Number of days for score to decay to 50%
    
    Returns:
        Decay factor between 0 and 1
    """
    if days_ago < 0:
        return 1.0
    
    decay_rate = math.log(2) / half_life_days
    return math.exp(-decay_rate * days_ago)


def calculate_diversity_score(items: List[Dict[str, Any]], key: str) -> float:
    """
    Calculate diversity score for a list of items based on a specific attribute.
    Higher diversity leads to better recommendations.
    
    Args:
        items: List of items to evaluate
        key: Attribute key to check for diversity
    
    Returns:
        Diversity score between 0 and 1
    """
    if not items:
        return 0.0
    
    unique_values = set(item.get(key) for item in items if key in item)
    total_items = len(items)
    
    if total_items == 0:
        return 0.0
    
    return len(unique_values) / total_items


def rank_by_multiple_criteria(
    items: List[Dict[str, Any]],
    criteria: List[Tuple[str, float, bool]],
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Rank items by multiple weighted criteria.
    
    Args:
        items: List of items to rank
        criteria: List of (key, weight, higher_is_better) tuples
        limit: Optional limit on number of results
    
    Returns:
        Sorted list of items with computed scores
    """
    for item in items:
        total_score = 0.0
        
        for key, weight, higher_is_better in criteria:
            value = item.get(key, 0.0)
            if isinstance(value, (int, float, Decimal)):
                value = float(value)
            else:
                value = 0.0
            
            if higher_is_better:
                total_score += value * weight
            else:
                total_score += (1.0 - value) * weight
        
        item['_computed_score'] = total_score
    
    items.sort(key=lambda x: x.get('_computed_score', 0.0), reverse=True)
    
    if limit:
        items = items[:limit]
    
    return items


def calculate_jaccard_similarity(set1: set, set2: set) -> float:
    """
    Calculate Jaccard similarity coefficient between two sets.
    Used for comparing tag sets, interest sets, etc.
    
    Args:
        set1: First set
        set2: Second set
    
    Returns:
        Jaccard similarity coefficient (0-1)
    """
    if not set1 and not set2:
        return 1.0
    
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0


def calculate_pearson_correlation(x_values: List[float], y_values: List[float]) -> float:
    """
    Calculate Pearson correlation coefficient.
    Used for measuring linear correlation between two variables.
    
    Args:
        x_values: First list of values
        y_values: Second list of values
    
    Returns:
        Pearson correlation coefficient (-1 to 1)
    """
    if len(x_values) != len(y_values) or len(x_values) < 2:
        return 0.0
    
    n = len(x_values)
    mean_x = sum(x_values) / n
    mean_y = sum(y_values) / n
    
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values))
    
    variance_x = sum((x - mean_x) ** 2 for x in x_values)
    variance_y = sum((y - mean_y) ** 2 for y in y_values)
    
    denominator = math.sqrt(variance_x * variance_y)
    
    if denominator == 0:
        return 0.0
    
    return numerator / denominator


def apply_diminishing_returns(score: float, saturation_point: float = 0.8) -> float:
    """
    Apply diminishing returns to a score using a logarithmic function.
    Prevents over-weighting of very high scores.
    
    Args:
        score: Input score (0-1)
        saturation_point: Point at which returns start diminishing rapidly
    
    Returns:
        Adjusted score with diminishing returns
    """
    if score <= 0:
        return 0.0
    
    if score >= 1.0:
        return 1.0
    
    return saturation_point * (1 - math.exp(-score / saturation_point))


def calculate_recency_boost(
    created_at: datetime,
    boost_days: int = 7,
    max_boost: float = 0.2
) -> float:
    """
    Calculate recency boost for newly added content.
    
    Args:
        created_at: When the content was created
        boost_days: Number of days to apply boost
        max_boost: Maximum boost value
    
    Returns:
        Recency boost value (0 to max_boost)
    """
    days_old = (datetime.utcnow() - created_at).days
    
    if days_old < 0:
        return 0.0
    
    if days_old >= boost_days:
        return 0.0
    
    remaining_ratio = 1.0 - (days_old / boost_days)
    return max_boost * remaining_ratio


def filter_by_confidence(
    items: List[Dict[str, Any]],
    confidence_key: str = 'confidence',
    min_confidence: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Filter items by minimum confidence threshold.
    
    Args:
        items: List of items to filter
        confidence_key: Key containing confidence score
        min_confidence: Minimum confidence threshold
    
    Returns:
        Filtered list of items
    """
    return [
        item for item in items
        if item.get(confidence_key, 0.0) >= min_confidence
    ]


def deduplicate_recommendations(
    items: List[Dict[str, Any]],
    key: str = 'id'
) -> List[Dict[str, Any]]:
    """
    Remove duplicate items while preserving order and keeping highest scoring duplicates.
    
    Args:
        items: List of items
        key: Key to check for duplicates
    
    Returns:
        Deduplicated list
    """
    seen = set()
    result = []
    
    for item in items:
        item_key = item.get(key)
        if item_key is not None and item_key not in seen:
            seen.add(item_key)
            result.append(item)
    
    return result


def calculate_engagement_quality(
    views: int,
    downloads: int,
    bookmarks: int,
    completions: int,
    max_views: int = 1000
) -> float:
    """
    Calculate engagement quality score based on multiple engagement metrics.
    
    Args:
        views: Number of views
        downloads: Number of downloads
        bookmarks: Number of bookmarks
        completions: Number of completions
        max_views: Maximum expected views for normalization
    
    Returns:
        Engagement quality score (0-1)
    """
    if views == 0:
        return 0.0
    
    view_score = min(views / max_views, 1.0) * 0.25
    download_rate = min(downloads / max(views, 1), 1.0) * 0.25
    bookmark_rate = min(bookmarks / max(views, 1), 1.0) * 0.25
    completion_rate = min(completions / max(views, 1), 1.0) * 0.25
    
    return view_score + download_rate + bookmark_rate + completion_rate


def calculate_improvement_trajectory(scores: List[float]) -> str:
    """
    Calculate the trajectory of score improvements over time.
    
    Args:
        scores: List of scores in chronological order
    
    Returns:
        Trajectory classification: 'improving', 'declining', 'stable', 'insufficient_data'
    """
    if len(scores) < 3:
        return 'insufficient_data'
    
    differences = [scores[i+1] - scores[i] for i in range(len(scores)-1)]
    avg_change = sum(differences) / len(differences)
    
    threshold = 2.0
    
    if avg_change > threshold:
        return 'improving'
    elif avg_change < -threshold:
        return 'declining'
    else:
        return 'stable'


def calculate_optimal_batch_size(
    total_items: int,
    target_diversity: float = 0.7,
    min_batch: int = 5,
    max_batch: int = 20
) -> int:
    """
    Calculate optimal batch size for recommendations to maintain diversity.
    
    Args:
        total_items: Total number of available items
        target_diversity: Target diversity ratio
        min_batch: Minimum batch size
        max_batch: Maximum batch size
    
    Returns:
        Optimal batch size
    """
    optimal = int(total_items * target_diversity)
    return max(min_batch, min(optimal, max_batch))


def merge_recommendation_sources(
    sources: List[List[Dict[str, Any]]],
    weights: List[float],
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Merge recommendations from multiple sources with different weights.
    
    Args:
        sources: List of recommendation lists
        weights: Weight for each source
        limit: Maximum number of results
    
    Returns:
        Merged and ranked recommendations
    """
    if len(sources) != len(weights):
        raise ValueError("Number of sources must match number of weights")
    
    merged = {}
    
    for source, weight in zip(sources, weights):
        for item in source:
            item_id = item.get('id') or item.get('material_id')
            if item_id is not None:
                if item_id in merged:
                    merged[item_id]['score'] += item.get('score', 0.0) * weight
                else:
                    merged[item_id] = item.copy()
                    merged[item_id]['score'] = item.get('score', 0.0) * weight
    
    result = list(merged.values())
    result.sort(key=lambda x: x.get('score', 0.0), reverse=True)
    
    return result[:limit]
