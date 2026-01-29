
import React from 'react';

const testimonials = [
  {
    name: "Sarah Jenkins",
    location: "London, UK",
    text: "I've been on many safaris, but Zipton was different. They didn't just show us lions; they introduced us to the Maasai warriors who protect them. Truly life-changing.",
    img: "https://picsum.photos/id/1027/100/100"
  },
  {
    name: "Marco Rossi",
    location: "Milan, Italy",
    text: "The energy and empathy of the Zipton team are unmatched. Our guide felt like a brother by the end of the trip. Highly recommend the Mt. Kenya trek!",
    img: "https://picsum.photos/id/1012/100/100"
  },
  {
    name: "Elena Thompson",
    location: "New York, USA",
    text: "From the sunset dhow sails in Lamu to the early morning drives in Amboseli, every detail was perfect. The cultural immersion felt respectful and genuine.",
    img: "https://picsum.photos/id/1029/100/100"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zipton-brown mb-4">What Our Explorers Say</h2>
          <div className="flex justify-center space-x-1 text-zipton-orange">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-between">
              <div>
                <svg className="w-10 h-10 text-zipton-orange/20 mb-6" fill="currentColor" viewBox="0 0 32 32"><path d="M10 8v8h6v-8h-6zM22 8v8h6v-8h-6zM10 18h6v8h-6v-8zM22 18h6v8h-6v-8z" /></svg>
                <p className="text-gray-600 italic text-lg mb-8 leading-relaxed">"{t.text}"</p>
              </div>
              <div className="flex items-center space-x-4">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full border-2 border-zipton-orange" />
                <div>
                  <h4 className="font-bold text-zipton-brown">{t.name}</h4>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
