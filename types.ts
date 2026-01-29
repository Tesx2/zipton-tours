
export interface Experience {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'Adventure' | 'Culture' | 'Combined';
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface ItineraryResponse {
  summary: string;
  days: {
    day: number;
    title: string;
    activities: string[];
  }[];
}
