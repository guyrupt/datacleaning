const amazonScraper = require('amazon-buddy');
const cliProgress = require('cli-progress');
const { writeCSV } = require('./csv_helper.js');
const { uploadCSV } = require('./s3.js');

const keywords = ["Laptop", "Smartphone", "Headphones", "Bluetooth Speaker", "Kitchenware", "Sports Equipment", "Fitness Tracker", "Men's Shoes", "Women's Shoes", "Children's Clothing", "Novels", "Textbooks", "Groceries", "Pet Supplies", "Cosmetics", "Skin Care", "Hair Care", "Toys", "Video Games", "Gardening Tools", "Outdoor Furniture", "Indoor Furniture", "Cookbooks", "Musical Instruments", "Car Accessories", "Bike", "Watches", "Jewelry", "Sunglasses", "Handbags", "Backpacks", "Luggage", "Cameras", "Printers", "Office Supplies", "Stationery", "Board Games", "Craft Supplies", "Home Decor", "Bedding", "Kitchen Appliances", "Television", "Audio Equipment", "Smart Home Devices", "Books", "Ebooks", "Magazines", "Music CDs", "Vinyl Records", "DVDs", "Blu-Ray Discs", "Baby Clothing", "Baby Gear", "Maternity Clothing", "Men's Clothing", "Women's Clothing", "Men's Accessories", "Women's Accessories", "Shoes", "Socks", "Underwear", "Swimwear", "Electronics", "Computer Accessories", "Software", "Hardware Tools", "Painting Supplies", "Plumbing Equipment", "Lighting Fixtures", "Camping Gear", "Fishing Equipment", "Hiking Gear", "Bathroom Accessories", "Kitchen Gadgets", "Coffee Maker", "Tea Accessories", "Wine Accessories", "Grilling Tools", "Yoga Mat", "Workout Clothing", "Running Shoes", "Fitness DVDs", "Protein Powder", "Vitamins", "Supplements", "First Aid Supplies", "Prescription Glasses", "Contact Lenses", "Sewing Machine", "Knitting Supplies", "Scrapbooking Materials", "Party Decorations", "Gift Wrapping Supplies", "Holiday Decorations", "Costumes", "Candles", "Essential Oils", "Cleaning Supplies", "Laundry Detergent", "Vacuum Cleaner"];

const getProductByKeyword = async () => {
    const searchProducts = []
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    progressBar.start(100, 0);

    for (const keyword of keywords.slice(0, 1)) {
        let products;

        try {
            products = await amazonScraper.products({ 
                keyword: keyword, 
                number:50, 
                rating: [4, 5],
            });
        } catch (err) {
            console.log(err);

            progressBar.increment();
            continue;
        }

        // Get at most 100 products for each keyword
        const limit = 100;
        let count = 0;
        
        for (const product of products.result) {
            if (count >= limit) // At most 50 products per keyword
                break;

            if (product.reviews.total_reviews > 5){
                count += 1;

                searchProducts.push({
                    product_id: product.asin,
                    product_name: product.title.replace("Sponsored Ad - ", ""),
                    img_link: product.thumbnail,
                    about_product:"",
                    review_title: "",
                    review_content: ""
                })
            }
        }

        progressBar.increment();
    }

    progressBar.stop();

    return searchProducts;
}

const getReviewsByASIN = async (asin) => {

    const reviews = await amazonScraper.reviews({ 
        asin: asin, 
        rating: [4, 5],
    });

    const firstReview = reviews.result[0];

    if (firstReview !== undefined) {
        return {title: firstReview.title, content: firstReview.review}
    }

    else {
        return null;
    }
}


const getAboutProductByASIN = async (asin) => {
    const product_by_asin = await amazonScraper.asin({ asin: asin });

    const result = product_by_asin.result[0];

    if (result !== undefined) {
        return result.description;
    }

    else {
        return null;
    }
}



const main = async() => {

    // Get list of products (name, asin, imageUrl)
    const products = await getProductByKeyword();
    const finalProducts = [];
    const filename = "amazon-scrap.csv";
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    console.log(products);

    // Get reviews and about_product for each product
    progressBar.start(products.length, 0);

    for (product of products) {
        try{
            const review = await getReviewsByASIN(product.product_id);
            //const about_product = await getAboutProductByASIN(product.product_id);

            if (review !== null){
                product.review_title = review.title;
                product.review_content = review.content;
                // product.about_product = about_product;
    
                finalProducts.push(product);
            } 
        } catch (err) {
            console.log(err);
        }

        progressBar.increment();
       
    }

    progressBar.stop();

    // Write data to CSV, then upload to S3
    writeCSV(finalProducts, filename);
    uploadCSV(filename);
}   

main();