<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'event_id',
        'speaker_id',
        'title',
        'description',
        'date',
        'start_time',
        'end_time',
        'location',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Get the event that owns the schedule.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the speaker for this schedule item.
     */
    public function speaker()
    {
        return $this->belongsTo(EventSpeaker::class, 'speaker_id');
    }
}