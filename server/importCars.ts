/**
 * Import cars from Excel file to database
 */
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { cars } from "../drizzle/schema";

export const importRouter = router({
  /**
   * Import sample cars for testing
   */
  importSampleCars: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Sample EV data to populate the website
    const sampleCars = [
      {
        make: "Tesla",
        model: "Model 3",
        year: 2024,
        price: "42990",
        mileage: 150,
        condition: "used" as const,
        bodyType: "Saloon",
        color: "Pearl White",
        fuelType: "Electric",
        transmission: "Automatic",
        range: 358,
        batteryCapacity: "75.00",
        acceleration: "3.1",
        chargingTime: "30 min (10-80%)",
        mainImage: "https://tesla-cdn.thron.com/delivery/public/image/tesla/c82315a6-ac99-464a-a753-c26bc0fb647d/bvlatuR/std/1200x628/lhd-model-3-social",
        images: [
          "https://tesla-cdn.thron.com/delivery/public/image/tesla/c82315a6-ac99-464a-a753-c26bc0fb647d/bvlatuR/std/1200x628/lhd-model-3-social"
        ],
        description: "2024 Tesla Model 3 Long Range - Premium electric sedan with autopilot",
        isAvailable: true,
        isFeatured: true,
        location: "London"
      },
      {
        make: "BMW",
        model: "iX",
        year: 2024,
        price: "89900",
        mileage: 500,
        condition: "used" as const,
        bodyType: "SUV",
        color: "Mineral White",
        fuelType: "Electric",
        transmission: "Automatic",
        range: 380,
        batteryCapacity: "111.50",
        acceleration: "4.6",
        chargingTime: "35 min (10-80%)",
        mainImage: "https://www.bmw.co.uk/content/dam/bmw/common/all-models/i-series/ix/2023/navigation/bmw-ix-lci-phev-modelfinder.png",
        images: [
          "https://www.bmw.co.uk/content/dam/bmw/common/all-models/i-series/ix/2023/navigation/bmw-ix-lci-phev-modelfinder.png"
        ],
        description: "2024 BMW iX xDrive50 - Luxury electric SUV with advanced technology",
        isAvailable: true,
        isFeatured: true,
        location: "Manchester"
      },
      {
        make: "Audi",
        model: "e-tron GT",
        year: 2023,
        price: "105000",
        mileage: 2000,
        condition: "used" as const,
        bodyType: "Saloon",
        color: "Daytona Grey",
        fuelType: "Electric",
        transmission: "Automatic",
        range: 298,
        batteryCapacity: "93.40",
        acceleration: "3.3",
        chargingTime: "22.5 min (5-80%)",
        mainImage: "https://www.audi.co.uk/content/dam/nemo/models/e-tron-gt/my-2024/1920x1080-gallery/1920x1080_AQ8_240001.jpg",
        images: [
          "https://www.audi.co.uk/content/dam/nemo/models/e-tron-gt/my-2024/1920x1080-gallery/1920x1080_AQ8_240001.jpg"
        ],
        description: "2023 Audi e-tron GT Quattro - High-performance electric grand tourer",
        isAvailable: true,
        isFeatured: false,
        location: "Birmingham"
      },
      {
        make: "Mercedes-Benz",
        model: "EQS",
        year: 2024,
        price: "119900",
        mileage: 300,
        condition: "used" as const,
        bodyType: "Saloon",
        color: "Obsidian Black",
        fuelType: "Electric",
        transmission: "Automatic",
        range: 453,
        batteryCapacity: "107.80",
        acceleration: "4.3",
        chargingTime: "31 min (10-80%)",
        mainImage: "https://www.mercedes-benz.co.uk/passengercars/mercedes-benz-cars/models/eqs/saloon-v297/explore/highlights/_jcr_content/root/paragraph/paragraph-right/paragraphimage/media/slides/videoimageslide/image.MQ6.12.20220404093617.jpeg",
        images: [
          "https://www.mercedes-benz.co.uk/passengercars/mercedes-benz-cars/models/eqs/saloon-v297/explore/highlights/_jcr_content/root/paragraph/paragraph-right/paragraphimage/media/slides/videoimageslide/image.MQ6.12.20220404093617.jpeg"
        ],
        description: "2024 Mercedes-Benz EQS 450+ - Flagship electric luxury sedan with MBUX Hyperscreen",
        isAvailable: true,
        isFeatured: true,
        location: "Leeds"
      },
      {
        make: "Porsche",
        model: "Taycan",
        year: 2024,
        price: "89900",
        mileage: 1200,
        condition: "used" as const,
        bodyType: "Saloon",
        color: "Frozen Blue Metallic",
        fuelType: "Electric",
        transmission: "Automatic",
        range: 301,
        batteryCapacity: "93.40",
        acceleration: "3.8",
        chargingTime: "22.5 min (5-80%)",
        mainImage: "https://files.porsche.com/filestore/image/multimedia/none/j1-taycan-modelimage-sideshot/model/cfbb8ed3-1a15-11ea-80c7-005056bbdc38/porsche-model.png",
        images: [
          "https://files.porsche.com/filestore/image/multimedia/none/j1-taycan-modelimage-sideshot/model/cfbb8ed3-1a15-11ea-80c7-005056bbdc38/porsche-model.png"
        ],
        description: "2024 Porsche Taycan 4S - Sports electric sedan with exceptional handling",
        isAvailable: true,
        isFeatured: false,
        location: "Bristol"
      }
    ];

    // Insert sample cars
    for (const car of sampleCars) {
      await db.insert(cars).values(car);
    }

    return {
      success: true,
      count: sampleCars.length,
      message: `Imported ${sampleCars.length} sample cars successfully`
    };
  })
});
