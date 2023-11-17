const amazonScraper = require('amazon-buddy');

const keywords = ["Laptop", "Smartphone", "Headphones", "Bluetooth Speaker", "Kitchenware", "Sports Equipment", "Fitness Tracker", "Men's Shoes", "Women's Shoes", "Children's Clothing", "Novels", "Textbooks", "Groceries", "Pet Supplies", "Cosmetics", "Skin Care", "Hair Care", "Toys", "Video Games", "Gardening Tools", "Outdoor Furniture", "Indoor Furniture", "Cookbooks", "Musical Instruments", "Car Accessories", "Bike", "Watches", "Jewelry", "Sunglasses", "Handbags", "Backpacks", "Luggage", "Cameras", "Printers", "Office Supplies", "Stationery", "Board Games", "Craft Supplies", "Home Decor", "Bedding", "Kitchen Appliances", "Television", "Audio Equipment", "Smart Home Devices", "Books", "Ebooks", "Magazines", "Music CDs", "Vinyl Records", "DVDs", "Blu-Ray Discs", "Baby Clothing", "Baby Gear", "Maternity Clothing", "Men's Clothing", "Women's Clothing", "Men's Accessories", "Women's Accessories", "Shoes", "Socks", "Underwear", "Swimwear", "Electronics", "Computer Accessories", "Software", "Hardware Tools", "Painting Supplies", "Plumbing Equipment", "Lighting Fixtures", "Camping Gear", "Fishing Equipment", "Hiking Gear", "Bathroom Accessories", "Kitchen Gadgets", "Coffee Maker", "Tea Accessories", "Wine Accessories", "Grilling Tools", "Yoga Mat", "Workout Clothing", "Running Shoes", "Fitness DVDs", "Protein Powder", "Vitamins", "Supplements", "First Aid Supplies", "Prescription Glasses", "Contact Lenses", "Sewing Machine", "Knitting Supplies", "Scrapbooking Materials", "Party Decorations", "Gift Wrapping Supplies", "Holiday Decorations", "Costumes", "Candles", "Essential Oils", "Cleaning Supplies", "Laundry Detergent", "Vacuum Cleaner"]



const getProductByKeyword = async () => {
    const searchProducts = []

    for (const keyword of keywords) {
        const products = await amazonScraper.products({ keyword: keyword, number:50, rating: [4, 5]});
        
        for (const product of products.result) {
            if (product.reviews.total_reviews > 5){
                searchProducts.push({
                    asin: product.asin,
                    name: product.title,
                    image: product.thumbnail,
                    review_title: "",
                    review_content: ""
                })
            }
        }
    }

    return searchProducts;
}

const getReviewsByAsin = async (asin) => {
    const reviews = await amazonScraper.reviews({ asin: asin, rating: [4, 5] });

    const firstReview = reviews.result[0];

    if (firstReview !== undefined) {
        return {title: firstReview.title, content: firstReview.review}
    }

    else {
        return null;
    }
}

const main = async() => {
    
    const products = await getProductByKeyword();
    const finalProducts = []

    for (product of products) {
        // product.review_title = "fe"
        const res = await getReviewsByAsin(product.asin);

        if (res !== null){
            product.review_title = res.title;
            product.review_content = res.content;

            finalProducts.push(product);
        }

        
    }
    
    console.log(finalProducts);
    
}

main();