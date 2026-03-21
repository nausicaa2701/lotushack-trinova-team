from math import asin, cos, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    lat1_r = radians(lat1)
    lat2_r = radians(lat2)

    a = sin(d_lat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(d_lng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return EARTH_RADIUS_KM * c


def point_to_segment_km(
    point_lat: float,
    point_lng: float,
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
) -> float:
    if start_lat == end_lat and start_lng == end_lng:
        return haversine_km(point_lat, point_lng, start_lat, start_lng)

    mean_lat = radians((start_lat + end_lat + point_lat) / 3)
    scale_x = EARTH_RADIUS_KM * cos(mean_lat)
    scale_y = EARTH_RADIUS_KM

    point_x = radians(point_lng) * scale_x
    point_y = radians(point_lat) * scale_y
    start_x = radians(start_lng) * scale_x
    start_y = radians(start_lat) * scale_y
    end_x = radians(end_lng) * scale_x
    end_y = radians(end_lat) * scale_y

    seg_x = end_x - start_x
    seg_y = end_y - start_y
    seg_len_sq = seg_x * seg_x + seg_y * seg_y
    if seg_len_sq == 0:
        dx = point_x - start_x
        dy = point_y - start_y
        return sqrt(dx * dx + dy * dy)

    projection = ((point_x - start_x) * seg_x + (point_y - start_y) * seg_y) / seg_len_sq
    projection = max(0.0, min(1.0, projection))

    closest_x = start_x + projection * seg_x
    closest_y = start_y + projection * seg_y
    dx = point_x - closest_x
    dy = point_y - closest_y
    return sqrt(dx * dx + dy * dy)


def route_detour_proxy_km(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
    merchant_lat: float,
    merchant_lng: float,
) -> float:
    origin_to_destination = haversine_km(origin_lat, origin_lng, destination_lat, destination_lng)
    origin_to_merchant = haversine_km(origin_lat, origin_lng, merchant_lat, merchant_lng)
    merchant_to_destination = haversine_km(merchant_lat, merchant_lng, destination_lat, destination_lng)
    return max(0.0, origin_to_merchant + merchant_to_destination - origin_to_destination)
