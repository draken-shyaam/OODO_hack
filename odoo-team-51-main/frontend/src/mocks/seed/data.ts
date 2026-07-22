export const seedData = {
  users: [
    { id: 'u1', name: 'Mahesh Gupta', email: 'mahesh@pinerp.local', position: 'Sales Manager', isAdmin: true, permissions: [] },
    { id: 'u2', name: 'Nisarg Verma', email: 'nisarg@pinerp.local', position: 'Purchase User', isAdmin: false, permissions: [] },
    { id: 'u3', name: 'Sweta Kediya', email: 'sweta@pinerp.local', position: 'Manufacturing User', isAdmin: false, permissions: [] },
    { id: 'u4', name: 'Dinesh Patel', email: 'dinesh@pinerp.local', position: 'Inventory Manager', isAdmin: false, permissions: [] },
    { id: 'u5', name: 'Trisha K.', email: 'trisha@pinerp.local', position: 'Sales User', isAdmin: false, permissions: [] }
  ],
  customers: [
    { id: 'c1', name: 'Suzuki India', email: 'contact@suzuki.in' },
    { id: 'c2', name: 'MRF Ltd.', email: 'purchase@mrftyres.com' }
  ],
  vendors: [
    { id: 'v1', name: 'Mayfair Co.', email: 'sales@mayfair.com' },
    { id: 'v2', name: 'OMA Mahek', email: 'info@omamahek.in' }
  ],
  products: [
    { id: 'p1', reference: 'PROD-000001', name: 'Door Frames', salesPrice: 10.00, costPrice: 8.00, onHandQty: 50 },
    { id: 'p2', reference: 'PROD-000002', name: 'Lighting Frame', salesPrice: 5.00, costPrice: 3.00, onHandQty: 12 }
  ],
  salesOrders: [
    { id: 'so1', reference: 'SO-000001', customerId: 'c1', customerName: 'Suzuki India', salesPerson: 'Ravi Jadeja', status: 'Confirmed' },
    { id: 'so2', reference: 'SO-000002', customerId: 'c2', customerName: 'MRF Ltd.', salesPerson: 'Saloni Shaikh', status: 'Partially Delivered' }
  ],
  purchaseOrders: [
    { id: 'po1', reference: 'PO-000001', vendorId: 'v1', vendorName: 'Mayfair Co.', responsible: 'Vijay Sharma', status: 'Confirmed' },
    { id: 'po2', reference: 'PO-000002', vendorId: 'v2', vendorName: 'OMA Mahek', responsible: 'John Doe', status: 'Draft' }
  ],
  manufacturingOrders: [
    { id: 'mo1', reference: 'MO-000001', finishedProduct: 'Door Frames', quantity: 10, status: 'Confirmed', componentsStatus: 'Not Available' },
    { id: 'mo2', reference: 'MO-000002', finishedProduct: 'Lighting Frame', quantity: 5, status: 'Draft', componentsStatus: 'Available' }
  ],
  boms: [
    { id: 'bom1', reference: 'BOM-000001', finishedProduct: 'Door Frames', quantity: 10 },
    { id: 'bom2', reference: 'BOM-000002', finishedProduct: 'Lighting Frame', quantity: 5 }
  ]
};
