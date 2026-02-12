export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  images: string[];
  rating: number;
  reviewCount: number;
  attributes: {
    [key: string]: string[];
  };
  variants: {
    [key: string]: string[];
  };
  tags?: string[];
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  slug: string;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  variant: {
    [key: string]: string;
  };
};

export type Order = {
  id: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: CartItem[];
};

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  imageId: string;
  content: string;
};
