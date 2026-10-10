# ShopZone — Accessible Shopping Dashboard

An accessible, responsive shopping dashboard built using HTML, CSS, and JavaScript for an internship capstone project.

## Features

- Demo login and logout
- Product catalog using Fake Store API
- Search products by name or category
- Filter products by category
- Sort products by price and name
- Add products to cart
- Increase and decrease cart quantities
- Remove products and clear the cart
- Create, view, edit, and delete custom products (CRUD)
- Save custom products, cart, and theme in browser localStorage
- Light and dark mode
- Responsive design for mobile and desktop
- Accessible form labels and keyboard focus indicators

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Fake Store API
- Browser localStorage
- GitHub

## Project Structure

    accessible-dashboard/
    ├── index.html
    ├── style.css
    ├── api.js
    ├── app.js
    └── README.md

## Architecture

    User
      |
      v
    HTML Interface
      |
      v
    JavaScript Application
      |
      +------> Fake Store API
      |          |
      |          v
      |       Product Catalog
      |
      +------> Browser localStorage
                 |
                 +-- Demo user
                 +-- Cart
                 +-- Custom products
                 +-- Theme preference

    CSS provides responsive styling and accessibility features.

## Setup Instructions

1. Clone or download this repository.
2. Keep all four code files in the same folder.
3. Open index.html in a modern browser.
4. Connect to the internet to load online products.
5. Enter a name and email to use the demo dashboard.
6. Test the catalog, cart, theme, and CRUD features.

For more reliable local API testing, use a local development server.

## Deployment

This is a static website and can be deployed using GitHub Pages or Netlify.

For GitHub Pages:

1. Open the repository on GitHub.
2. Go to Settings.
3. Select Pages.
4. Choose the main branch and root folder.
5. Save the settings.
6. Open the published website URL after deployment finishes.

## Important Limitations

- Login is simulated and is not secure authentication.
- Do not enter real passwords or sensitive information.
- localStorage saves data only in the current browser and device.
- Custom products are not shared through a cloud database.
- The cart does not process real orders or payments.
- The online catalog requires internet access.

## Conclusion

ShopZone demonstrates front-end development, API integration,
product filtering, shopping cart functionality, CRUD operations,
browser storage, responsive design, and accessibility practices.

This project is intended for educational and internship demonstration.