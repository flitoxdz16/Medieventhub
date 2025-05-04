<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'certificate_number',
        'qr_code',
        'user_id',
        'event_id',
        'registration_id',
        'issued_date',
        'revoked',
        'revoked_at',
        'revoked_by_id',
        'revocation_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'issued_date' => 'datetime',
        'revoked' => 'boolean',
        'revoked_at' => 'datetime',
    ];

    /**
     * Get the user that owns the certificate.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the event that this certificate is for.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the registration that this certificate is for.
     */
    public function registration()
    {
        return $this->belongsTo(EventRegistration::class, 'registration_id');
    }

    /**
     * Get the user who revoked this certificate.
     */
    public function revokedBy()
    {
        return $this->belongsTo(User::class, 'revoked_by_id');
    }

    /**
     * Scope a query to only include revoked certificates.
     */
    public function scopeRevoked($query)
    {
        return $query->where('revoked', true);
    }

    /**
     * Scope a query to only include valid certificates.
     */
    public function scopeValid($query)
    {
        return $query->where('revoked', false);
    }
}