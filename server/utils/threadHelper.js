/**
 * Shared Lifecycle Thread Helpers for Food Posts & Realtime Notifications
 */

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const buildPostLifecycleThread = (row, receiverRequests = []) => {
  const steps = [];

  // Step 1: Donation Posted
  const locationStr = [row.floor_flat, row.house_no, row.road_no, row.area_ward, row.thana, row.district]
    .filter(Boolean)
    .join(', ') || 'Donor Location';

  steps.push({
    step: 1,
    stage_key: 'donor_posted',
    label: 'Food Posted by Donor',
    title: '🍲 Donation Post Created',
    detail: `${row.donor_name} (Phone: ${row.donor_phone || 'N/A'}) posted ${row.food_name || row.title || 'Food Donation'} (${row.initial_quantity} portions) at ${locationStr}.`,
    time: formatTimeAgo(row.post_created_at),
    full_date: formatFullDate(row.post_created_at),
    status: 'completed',
    actor: {
      name: row.donor_name,
      role: 'Donor',
      phone: row.donor_phone,
      email: row.donor_email
    }
  });

  // Step 2: NGO Collection Requested & Approved
  const ngoName = row.ngo_organization_name || row.ngo_user_name;
  if (row.ngo_request_id) {
    steps.push({
      step: 2,
      stage_key: 'ngo_requested',
      label: 'NGO Accepted & Approved',
      title: '🏢 NGO Collection Approved',
      detail: `${ngoName} (Rep: ${row.ngo_user_name}, Phone: ${row.ngo_user_phone || 'N/A'}) requested collection for ${row.ngo_requested_quantity || row.initial_quantity} portions. Donor approved the collection request.`,
      time: formatTimeAgo(row.ngo_requested_at),
      full_date: formatFullDate(row.ngo_requested_at),
      status: 'completed',
      actor: {
        name: ngoName,
        role: 'NGO Partner',
        phone: row.ngo_user_phone,
        email: row.ngo_user_email
      }
    });
  } else {
    steps.push({
      step: 2,
      stage_key: 'ngo_requested',
      label: 'NGO Collection Request',
      title: '🏢 Waiting for NGO Pickup Request',
      detail: 'Available for verified NGO pickup in the locality.',
      time: 'Pending',
      full_date: '',
      status: 'pending'
    });
  }

  // Step 3: Assigned Staff & Picked Up from Donor
  const pickupStaffName = row.picked_up_staff_name || row.assigned_staff_name;
  const pickupStaffPhone = row.picked_up_staff_phone || row.assigned_staff_phone;
  if (row.picked_up_at) {
    steps.push({
      step: 3,
      stage_key: 'picked_up',
      label: 'Picked Up by Staff',
      title: '🛵 Food Picked Up from Donor',
      detail: `Pickup Staff ${pickupStaffName} (Phone: ${pickupStaffPhone || 'N/A'}) collected the food from donor location.`,
      time: formatTimeAgo(row.picked_up_at),
      full_date: formatFullDate(row.picked_up_at),
      status: 'completed',
      actor: {
        name: pickupStaffName,
        role: 'Pickup Staff',
        phone: pickupStaffPhone
      }
    });
  } else if (row.assigned_staff_id) {
    steps.push({
      step: 3,
      stage_key: 'picked_up',
      label: 'Pickup Staff Assigned',
      title: '🛵 Pickup in Progress',
      detail: `Assigned to Pickup Staff ${row.assigned_staff_name} (Phone: ${row.assigned_staff_phone || 'N/A'}). Currently en route to donor address.`,
      time: 'In Progress',
      full_date: '',
      status: 'in_progress',
      actor: {
        name: row.assigned_staff_name,
        role: 'Pickup Staff',
        phone: row.assigned_staff_phone
      }
    });
  } else {
    steps.push({
      step: 3,
      stage_key: 'picked_up',
      label: 'Staff Pickup',
      title: '🛵 Awaiting Staff Assignment',
      detail: 'Awaiting NGO manager assignment of receiving/pickup staff.',
      time: 'Pending',
      full_date: '',
      status: 'pending'
    });
  }

  // Step 4: NGO Hub Inspection & Quality Verification
  if (row.received_at_hub_at) {
    steps.push({
      step: 4,
      stage_key: 'hub_inspected',
      label: 'Inspected at NGO Hub',
      title: '🔬 Food Safety Confirmed',
      detail: `Food delivered to NGO Hub. Inspected, temperature-checked, and safety verified by Hub Staff ${row.hub_staff_name || 'Quality Inspector'} (Phone: ${row.hub_staff_phone || 'N/A'}).`,
      time: formatTimeAgo(row.received_at_hub_at),
      full_date: formatFullDate(row.received_at_hub_at),
      status: 'completed',
      actor: {
        name: row.hub_staff_name || 'Hub Staff',
        role: 'Hub Quality Inspector',
        phone: row.hub_staff_phone
      }
    });
  } else {
    steps.push({
      step: 4,
      stage_key: 'hub_inspected',
      label: 'Hub Inspection',
      title: '🔬 Awaiting Hub Arrival & Inspection',
      detail: 'Pending safe arrival at NGO hub for quality and hygiene confirmation.',
      time: 'Pending',
      full_date: '',
      status: 'pending'
    });
  }

  // Step 5: Distribution Hub Setup
  const isDistributing = row.total_packets != null && row.total_packets > 0;
  if (isDistributing) {
    steps.push({
      step: 5,
      stage_key: 'distributing',
      label: 'Staged for Distribution',
      title: '📍 Distribution Point Active',
      detail: `Prepared at ${row.pickup_point_name || 'NGO Distribution Center'} (${row.pickup_point_address || 'Central Point'}). Staged ${row.total_packets} meal packets. Live remaining: ${row.remaining_packets ?? 0} packets.`,
      time: formatTimeAgo(row.received_at_hub_at || row.post_created_at),
      full_date: formatFullDate(row.received_at_hub_at || row.post_created_at),
      status: 'completed',
      actor: {
        name: row.pickup_point_name || 'Distribution Point',
        role: 'Distribution Hub',
        address: row.pickup_point_address
      }
    });
  } else {
    steps.push({
      step: 5,
      stage_key: 'distributing',
      label: 'Distribution Setup',
      title: '📍 Pending Distribution Staging',
      detail: 'Awaiting packaging and staging at designated NGO distribution center.',
      time: 'Pending',
      full_date: '',
      status: 'pending'
    });
  }

  // Step 6: Beneficiaries / Food Seekers Handover Logs
  const handovers = Array.isArray(row.distribution_logs) ? row.distribution_logs : [];
  const handedOverCount = handovers.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
  const isFullyDistributed = row.total_packets != null && row.remaining_packets === 0;

  if (handovers.length > 0) {
    steps.push({
      step: 6,
      stage_key: 'beneficiaries_collected',
      label: isFullyDistributed ? 'Fully Distributed' : 'Distribution in Progress',
      title: `🤝 ${handedOverCount} Servings Handed Over (${handovers.length} Beneficiaries)`,
      detail: `${handedOverCount} packets collected by verified food seekers. Handed over at hub with unique pickup codes verified. ${isFullyDistributed ? 'All meals distributed!' : `${row.remaining_packets} packets remaining.`}`,
      time: formatTimeAgo(handovers[handovers.length - 1]?.handed_over_at),
      full_date: formatFullDate(handovers[handovers.length - 1]?.handed_over_at),
      status: isFullyDistributed ? 'completed' : 'in_progress',
      handovers: handovers.map((h) => ({
        ...h,
        formatted_date: formatFullDate(h.handed_over_at),
        time_ago: formatTimeAgo(h.handed_over_at)
      }))
    });
  } else {
    steps.push({
      step: 6,
      stage_key: 'beneficiaries_collected',
      label: 'Food Seekers Collection',
      title: '🤝 Awaiting Food Seeker Claims',
      detail: 'No packets handed over to beneficiaries yet.',
      time: 'Pending',
      full_date: '',
      status: 'pending',
      handovers: []
    });
  }

  return {
    post_id: row.post_id,
    food_name: row.food_name || row.title || 'Food Donation',
    food_type: row.food_type,
    initial_quantity: row.initial_quantity,
    total_packets: row.total_packets || row.initial_quantity,
    remaining_packets: row.remaining_packets ?? row.initial_quantity,
    post_status: row.post_status,
    post_created_at: row.post_created_at,
    post_date: row.post_date || (row.post_created_at ? new Date(row.post_created_at).toISOString().split('T')[0] : ''),
    formatted_created_at: formatFullDate(row.post_created_at),
    donor: {
      id: row.donor_id,
      name: row.donor_name,
      phone: row.donor_phone,
      email: row.donor_email,
      address: locationStr
    },
    ngo: {
      id: row.ngo_user_id,
      name: row.ngo_user_name,
      phone: row.ngo_user_phone,
      organization_name: row.ngo_organization_name,
      requested_at: row.ngo_requested_at,
      status: row.ngo_request_status
    },
    pickup_staff: {
      id: row.picked_up_by_staff_id || row.assigned_staff_id,
      name: row.picked_up_staff_name || row.assigned_staff_name,
      phone: row.picked_up_staff_phone || row.assigned_staff_phone,
      picked_up_at: row.picked_up_at
    },
    hub_inspection: {
      id: row.received_at_hub_by_staff_id,
      name: row.hub_staff_name,
      phone: row.hub_staff_phone,
      received_at_hub_at: row.received_at_hub_at
    },
    distribution: {
      pickup_point_id: row.pickup_point_id,
      pickup_point_name: row.pickup_point_name,
      pickup_point_address: row.pickup_point_address,
      total_packets: row.total_packets,
      remaining_packets: row.remaining_packets
    },
    beneficiary_handovers: [...handovers]
      .sort((a, b) => new Date(b.handed_over_at || 0).getTime() - new Date(a.handed_over_at || 0).getTime())
      .map((h) => ({
        ...h,
        formatted_date: formatFullDate(h.handed_over_at),
        time_ago: formatTimeAgo(h.handed_over_at)
      })),
    receiver_requests: receiverRequests,
    steps
  };
};

module.exports = {
  formatTimeAgo,
  formatFullDate,
  buildPostLifecycleThread
};
