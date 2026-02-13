SELECT id, make, model, imageUrl, firebaseId
FROM cars
WHERE imageUrl IS NOT NULL
LIMIT 5;

SELECT id, make, model, imageUrl
FROM cars
WHERE imageUrl IS NULL
LIMIT 5;
