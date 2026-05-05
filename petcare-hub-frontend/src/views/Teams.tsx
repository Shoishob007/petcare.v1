import { motion } from 'motion/react';
import { Users, Calendar, MessageSquare, Plus, MoreHorizontal, CheckCircle2, Clock, MapPin, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Teams() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h1 className="font-headline text-4xl lg:text-6xl font-extrabold text-on-surface mb-4">Care <span className="text-primary italic">Teams</span></h1>
          <p className="text-on-surface-variant max-w-xl font-medium text-lg leading-relaxed">
            Collaborative sanctuary management. Sync schedules and medical updates with your inner circle.
          </p>
        </div>
        <button className="bg-primary text-on-primary px-8 py-4 rounded-xl font-extrabold text-lg flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/10">
          <UserPlus className="w-5 h-5" /> Add Member
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Active Team */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline font-bold text-xl flex items-center gap-3">
                 <Users className="w-6 h-6 text-primary" /> The Sanctuary Squad
              </h2>
              <button className="text-on-surface-variant hover:text-primary p-2">
                 <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Sarah Jenkins', role: 'Primary Owner', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop', status: 'Online' },
                { name: 'David Chen', role: 'Caregiver', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', status: 'In Transit' },
                { name: 'Dr. Mike Ross', role: 'Consulting Vet', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop', status: 'On Call' },
                { name: 'Bella\'s walker', role: 'Pro Walker', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', status: 'Active Now' }
              ].map((member, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 flex items-center gap-5 shadow-sm hover:shadow-editorial transition-all"
                >
                   <div className="relative">
                      <img src={member.img} alt={member.name} className="w-16 h-16 rounded-2xl object-cover" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-container-lowest rounded-full flex items-center justify-center p-0.5 shadow-sm">
                         <div className="w-full h-full bg-primary rounded-full" />
                      </div>
                   </div>
                   <div className="flex-1">
                      <h3 className="font-bold text-on-surface">{member.name}</h3>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">{member.role}</p>
                      <p className="text-[10px] font-bold text-primary">{member.status}</p>
                   </div>
                   <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                      <MessageSquare className="w-5 h-5" />
                   </button>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
             <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline font-bold text-xl flex items-center gap-3">
                 <Calendar className="w-6 h-6 text-primary" /> Shared Itinerary
              </h2>
              <button className="text-primary font-bold text-sm uppercase tracking-widest bg-primary-container px-4 py-2 rounded-xl">View Calendar</button>
            </div>

            <div className="space-y-4">
              {[
                { task: 'Morning Walk & Vitality Check', time: '08:00 AM', assigned: 'Sarah', status: 'completed' },
                { task: 'Evening Feeding & Medication', time: '06:30 PM', assigned: 'David', status: 'pending' },
                { task: 'Grooming Appointment', time: '12:00 PM (Tomorrow)', assigned: 'Bella\'s walker', status: 'pending' }
              ].map((task, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 flex items-center gap-6 group hover:border-primary/20 transition-all">
                   <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                     task.status === 'completed' ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant opacity-40"
                   )}>
                      {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                   </div>
                   <div className="flex-1">
                      <h4 className={cn("font-bold text-lg", task.status === 'completed' && "text-on-surface-variant line-through opacity-50")}>{task.task}</h4>
                      <div className="flex gap-4 mt-1">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                          <Clock className="w-3 h-3" /> {task.time}
                        </p>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                          <Users className="w-3 h-3" /> {task.assigned}
                        </p>
                      </div>
                   </div>
                   {task.status === 'pending' && (
                     <button className="px-6 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all">
                        Mark Done
                     </button>
                   )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Info / Stats Sidebar */}
        <div className="space-y-8">
           <section className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-6">Daily Summary</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-extrabold">2/3</div>
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">Tasks completed for Luna today.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-container/50 text-secondary rounded-2xl flex items-center justify-center font-extrabold">0</div>
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">Medical anomalies reported by team.</p>
                 </div>
              </div>
           </section>

           <section className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-6">Sanctuary Locations</h3>
              <div className="space-y-4">
                 {[
                   { name: 'Main Residence', type: 'Feeding Site', icon: MapPin },
                   { name: 'Hilltop Park', type: 'Exercise Hub', icon: MapPin },
                   { name: 'Central Vet', type: 'Medical Site', icon: Plus }
                 ].map((loc, idx) => (
                   <div key={idx} className="flex gap-4 items-center group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-all">
                         <loc.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{loc.name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">{loc.type}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

