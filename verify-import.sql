-- Count total dealers
SELECT COUNT(*) as total_dealers FROM dealers;

-- Count total cars
SELECT COUNT(*) as total_cars FROM cars;

-- Count cars with dealers assigned
SELECT COUNT(*) as cars_with_dealers FROM cars WHERE dealerId IS NOT NULL;

-- Top 5 dealers by car count
SELECT d.name, COUNT(c.id) as car_count 
FROM dealers d 
LEFT JOIN cars c ON d.id = c.dealerId 
GROUP BY d.id, d.name 
ORDER BY car_count DESC 
LIMIT 5;

-- Sample car with dealer info
SELECT c.make, c.model, c.year, c.price, d.name as dealer_name, d.phone, d.whatsappNumber
FROM cars c
JOIN dealers d ON c.dealerId = d.id
LIMIT 3;
