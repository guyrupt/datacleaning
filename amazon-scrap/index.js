const amazonScraper = require('amazon-buddy');
const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require('fs');
const cliProgress = require('cli-progress');
const { uploadCSV } = require('./s3.js');

const keywords = ["Laptop", "Smartphone", "Headphones", "Bluetooth Speaker", "Kitchenware", "Sports Equipment", "Fitness Tracker", "Men's Shoes", "Women's Shoes", "Children's Clothing", "Novels", "Textbooks", "Groceries", "Pet Supplies", "Cosmetics", "Skin Care", "Hair Care", "Toys", "Video Games", "Gardening Tools", "Outdoor Furniture", "Indoor Furniture", "Cookbooks", "Musical Instruments", "Car Accessories", "Bike", "Watches", "Jewelry", "Sunglasses", "Handbags", "Backpacks", "Luggage", "Cameras", "Printers", "Office Supplies", "Stationery", "Board Games", "Craft Supplies", "Home Decor", "Bedding", "Kitchen Appliances", "Television", "Audio Equipment", "Smart Home Devices", "Books", "Ebooks", "Magazines", "Music CDs", "Vinyl Records", "DVDs", "Blu-Ray Discs", "Baby Clothing", "Baby Gear", "Maternity Clothing", "Men's Clothing", "Women's Clothing", "Men's Accessories", "Women's Accessories", "Shoes", "Socks", "Underwear", "Swimwear", "Electronics", "Computer Accessories", "Software", "Hardware Tools", "Painting Supplies", "Plumbing Equipment", "Lighting Fixtures", "Camping Gear", "Fishing Equipment", "Hiking Gear", "Bathroom Accessories", "Kitchen Gadgets", "Coffee Maker", "Tea Accessories", "Wine Accessories", "Grilling Tools", "Yoga Mat", "Workout Clothing", "Running Shoes", "Fitness DVDs", "Protein Powder", "Vitamins", "Supplements", "First Aid Supplies", "Prescription Glasses", "Contact Lenses", "Sewing Machine", "Knitting Supplies", "Scrapbooking Materials", "Party Decorations", "Gift Wrapping Supplies", "Holiday Decorations", "Costumes", "Candles", "Essential Oils", "Cleaning Supplies", "Laundry Detergent", "Vacuum Cleaner"]


const getProductByKeyword = async () => {
    const searchProducts = []
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    progressBar.start(100, 0);

    for (const keyword of keywords) {
        let products;

        try {
            products = await amazonScraper.products({ 
                keyword: keyword, 
                number:50, 
                rating: [4, 5],
                proxy:['143.110.190.83:8080']
            });
        } catch (err) {
            console.log(err);

            progressBar.increment();
            continue;
        }
        
        let count = 0;
        progressBar.increment();
        
        for (const product of products.result) {
            if (count >= 50) // At most 50 products per keyword
                break;

            if (product.reviews.total_reviews > 5){
                count += 1;

                searchProducts.push({
                    asin: product.asin,
                    name: product.title.replace("Sponsored Ad - ", ""),
                    image: product.thumbnail,
                    review_title: "",
                    review_content: ""
                })
            }
        }
    }

    progressBar.stop();

    return searchProducts;
}

const getReviewsByASIN = async (asin) => {
    const reviews = await amazonScraper.reviews({ asin: asin, rating: [4, 5] });

    const firstReview = reviews.result[0];

    if (firstReview !== undefined) {
        return {title: firstReview.title, content: firstReview.review}
    }

    else {
        return null;
    }
}

const writeCSV = (products, filename) => {
    const csvString = convertArrayToCSV(products);
    
    fs.writeFile(filename, csvString, 'utf8', function (err) {
        if (err) {
            console.error("Error occured - CSV string not generated");
        } else{
            console.log('CSV string generated!');
        }
    });
}



const main = async() => {

    // Get list of products (name, asin, imageUrl)
    const products = await getProductByKeyword();
    const finalProducts = [];
    const filename = "amazon-scrap.csv";
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // Get reviews for each product
    progressBar.start(products.length, 0);

    for (product of products) {
        try{
            const res = await getReviewsByASIN(product.asin);

            if (res !== null){
                product.review_title = res.title;
                product.review_content = res.content;
    
                finalProducts.push(product);
            } 
        } catch (err) {
        }

        progressBar.increment();
       
    }

    progressBar.stop();

    // Write data to CSV, then upload to S3
    writeCSV(finalProducts, filename);
    uploadCSV(filename);
}   

main();